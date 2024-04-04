pub mod handlers;
mod notification;

use crate::{NOTIFICATIONS};
use ic_cdk::caller;
pub use notification::*;
pub use handlers::*;


use ic_cdk_macros::*;
use ic_websocket_cdk::{CanisterWsCloseArguments, CanisterWsCloseResult, CanisterWsGetMessagesArguments, CanisterWsGetMessagesResult, CanisterWsMessageArguments, CanisterWsMessageResult, CanisterWsOpenArguments, CanisterWsOpenResult, WsHandlers, WsInitParams};

use handlers::{on_close, on_message, on_open};
// use crate::handlers::{AppMessage, send_app_message};

// mod canister;


// Paste here the principal of the gateway obtained when running the gateway

pub fn init_websocket() {
    let handlers = WsHandlers {
        on_open: Some(on_open),
        on_message: Some(on_message),
        on_close: Some(on_close),
    };

    let params = WsInitParams::new(handlers);

    ic_websocket_cdk::init(params);
}

// #[post_upgrade]
// fn post_upgrade() {
//     init();
// }

// method called by the client to open a WS connection to the canister (relayed by the WS Gateway)
#[update]
fn ws_open(args: CanisterWsOpenArguments) -> CanisterWsOpenResult {
    ic_websocket_cdk::ws_open(args)
}

// method called by the Ws Gateway when closing the IcWebSocket connection for a client
#[update]
fn ws_close(args: CanisterWsCloseArguments) -> CanisterWsCloseResult {
    ic_websocket_cdk::ws_close(args)
}

// method called by the client to send a message to the canister (relayed by the WS Gateway)
#[update]
fn ws_message(args: CanisterWsMessageArguments, msg_type: Option<AppMessage>) -> CanisterWsMessageResult {
    ic_websocket_cdk::ws_message(args, msg_type)
}

// method called by the WS Gateway to get messages for all the clients it serves
#[query]
fn ws_get_messages(args: CanisterWsGetMessagesArguments) -> CanisterWsGetMessagesResult {
    ic_websocket_cdk::ws_get_messages(args)
}


#[query]
fn get_user_notifications() -> Vec<Notification> {
    Notification::get_list(&caller())
}

#[update]
fn see_notifications(id: String) {
    NOTIFICATIONS.with(|notifications| {
        let mut user_notifications = notifications.borrow_mut();
        let user_notifications = user_notifications.entry(caller()).or_insert_with(Vec::new);
        for notification in user_notifications.iter_mut() {
            if notification.id == id {
                notification.is_seen = true;
            }
        }
    });
}


