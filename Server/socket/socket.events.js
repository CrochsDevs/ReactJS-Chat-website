export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  DISCONNECTING: 'disconnecting',
  
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  USER_STATUS_CHANGE: 'user-status-change',
  
  JOIN_CHAT: 'join-chat',
  LEAVE_CHAT: 'leave-chat',
  
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  MESSAGE_SENT: 'message-sent',
  NEW_MESSAGE_NOTIFICATION: 'new-message-notification',
  
  TYPING: 'typing',
  USER_TYPING: 'user-typing',
  
  MARK_READ: 'mark-read',
  MESSAGES_READ: 'messages-read'
};