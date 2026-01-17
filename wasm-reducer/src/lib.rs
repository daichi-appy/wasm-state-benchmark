use serde::{Deserialize, Serialize};
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

#[derive(Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub title: String,
    pub tags: Vec<String>,
    pub rating: f64,
    #[serde(rename = "isPlayable")]
    pub is_playable: bool,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ViewState {
    #[serde(rename = "filteredCount")]
    pub filtered_count: usize,
    #[serde(rename = "currentPage")]
    pub current_page: usize,
    #[serde(rename = "itemsPerPage")]
    pub items_per_page: usize,
    #[serde(rename = "filterTag")]
    pub filter_tag: Option<String>,
    #[serde(rename = "filterPlayable")]
    pub filter_playable: Option<bool>,
    #[serde(rename = "sortBy")]
    pub sort_by: Option<String>,
    #[serde(rename = "sortOrder")]
    pub sort_order: String,
    #[serde(rename = "totalItems")]
    pub total_items: usize,
}

struct InternalState {
    items: Vec<Item>,
    filtered_indices: Vec<usize>,
    current_page: usize,
    items_per_page: usize,
    filter_tag: Option<String>,
    filter_playable: Option<bool>,
    sort_by: Option<String>,
    sort_order: String,
}

impl InternalState {
    fn new(items_per_page: usize) -> Self {
        Self {
            items: vec![],
            filtered_indices: vec![],
            current_page: 0,
            items_per_page,
            filter_tag: None,
            filter_playable: None,
            sort_by: None,
            sort_order: "asc".to_string(),
        }
    }

    fn apply_filters(&mut self) {
        let mut indices: Vec<usize> = (0..self.items.len()).collect();

        // Filter by tag
        if let Some(ref tag) = self.filter_tag {
            indices.retain(|&i| self.items[i].tags.contains(tag));
        }

        // Filter by playable
        if let Some(playable) = self.filter_playable {
            indices.retain(|&i| self.items[i].is_playable == playable);
        }

        // Sort
        if let Some(ref sort_by) = self.sort_by {
            let asc = self.sort_order == "asc";
            match sort_by.as_str() {
                "rating" => {
                    indices.sort_by(|&a, &b| {
                        let cmp = self.items[a]
                            .rating
                            .partial_cmp(&self.items[b].rating)
                            .unwrap();
                        if asc { cmp } else { cmp.reverse() }
                    });
                }
                "title" => {
                    indices.sort_by(|&a, &b| {
                        let cmp = self.items[a].title.cmp(&self.items[b].title);
                        if asc { cmp } else { cmp.reverse() }
                    });
                }
                _ => {}
            }
        }

        self.filtered_indices = indices;
    }

    fn get_view_state(&self) -> ViewState {
        ViewState {
            filtered_count: self.filtered_indices.len(),
            current_page: self.current_page,
            items_per_page: self.items_per_page,
            filter_tag: self.filter_tag.clone(),
            filter_playable: self.filter_playable,
            sort_by: self.sort_by.clone(),
            sort_order: self.sort_order.clone(),
            total_items: self.items.len(),
        }
    }

    fn get_page_items(&self) -> Vec<Item> {
        let start = self.current_page * self.items_per_page;
        let end = (start + self.items_per_page).min(self.filtered_indices.len());

        if start >= self.filtered_indices.len() {
            return vec![];
        }

        self.filtered_indices[start..end]
            .iter()
            .map(|&i| self.items[i].clone())
            .collect()
    }
}

thread_local! {
    static STATE: RefCell<InternalState> = RefCell::new(InternalState::new(20));
}

#[wasm_bindgen]
pub fn init_store(items_per_page: usize) {
    STATE.with(|state| {
        *state.borrow_mut() = InternalState::new(items_per_page);
    });
}

#[wasm_bindgen]
pub fn set_items(items: JsValue) -> Result<JsValue, JsValue> {
    let items: Vec<Item> = serde_wasm_bindgen::from_value(items)
        .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

    STATE.with(|state| {
        let mut s = state.borrow_mut();
        s.items = items;
        s.current_page = 0;
        s.apply_filters();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn filter_by_tag(tag: Option<String>) -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        s.filter_tag = tag;
        s.current_page = 0;
        s.apply_filters();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn filter_by_playable(playable: Option<bool>) -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        s.filter_playable = playable;
        s.current_page = 0;
        s.apply_filters();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn sort_by_rating() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        s.sort_by = Some("rating".to_string());
        s.apply_filters();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn sort_by_title() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        s.sort_by = Some("title".to_string());
        s.apply_filters();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn toggle_sort_order() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        s.sort_order = if s.sort_order == "asc" {
            "desc".to_string()
        } else {
            "asc".to_string()
        };
        s.apply_filters();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn set_page(page: usize) -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        let max_page = if s.filtered_indices.is_empty() {
            0
        } else {
            (s.filtered_indices.len() - 1) / s.items_per_page
        };
        s.current_page = page.min(max_page);
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn next_page() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        let max_page = if s.filtered_indices.is_empty() {
            0
        } else {
            (s.filtered_indices.len() - 1) / s.items_per_page
        };
        if s.current_page < max_page {
            s.current_page += 1;
        }
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn prev_page() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let mut s = state.borrow_mut();
        if s.current_page > 0 {
            s.current_page -= 1;
        }
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn get_page_items() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let s = state.borrow();
        let items = s.get_page_items();
        serde_wasm_bindgen::to_value(&items)
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}

#[wasm_bindgen]
pub fn get_view_state() -> Result<JsValue, JsValue> {
    STATE.with(|state| {
        let s = state.borrow();
        serde_wasm_bindgen::to_value(&s.get_view_state())
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
    })
}
