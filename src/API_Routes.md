# Api routes info for Fronend communication

## Services

- /auth:
  - POST /register - register user
  - POST /login - login user
- /user
  - GET /profileGet - get profile info
  - POST /profileUpdate - update profile info
- /chat
  - GET /userConversations - get all user conversation sorted from latest
  - GET /userConversations/:id - get one coversation using id (id = conversationId)
- /code
  - GET /repo - get user repository metadata
  - GET /repo/content - get user repository data
  - POST /repo/upload - upload code
- /matching
  - GET /matchGet - get 5 matched users
- /plagiarism
  - GET /plagGet - get plagiarism flag

## Completion score:

- /auth: Chat generated, not checked
- /user: Chat generated, good template but need to determine what to return on GET
- /chat: Get all/single conversations, first version model of send/recive
- /code: Template build for repo display, need deeper database understanding
- /matching: Completed, need testing
- /plagiarism: None
