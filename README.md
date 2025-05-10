```
npm install
npm run dev
```

```
open http://localhost:3000
```

```
backend/
├── src/
│   ├── app.ts                  # Main application entry point
│   ├── config/
│   │   ├── db.ts               # PostgreSQL configuration
│   │   ├── redis.ts            # Redis for real-time features
│   │   └── constants.ts        # App constants
│   ├── controllers/            # Route handlers
│   │   ├── auth.controller.ts
│   │   ├── code.controller.ts
│   │   ├── matching.controller.ts
│   │   └── video.controller.ts
│   ├── middlewares/            # Custom middlewares
│   │   ├── auth.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/                # Database models
│   │   ├── user.model.ts
│   │   ├── code.model.ts
│   │   ├── match.model.ts
│   │   └── chat.model.ts
│   ├── routes/                # Route definitions
│   │   ├── auth.route.ts
│   │   ├── code.route.ts
│   │   ├── matching.route.ts
│   │   └── video.route.ts
│   ├── services/              # Business logic
│   │   ├── auth.service.ts
│   │   ├── code.service.ts
│   │   ├── matching.service.ts
│   │   ├── plagiarism.service.ts
│   │   └── video.service.ts
│   ├── types/                 # Type definitions
│   │   ├── auth.types.ts
│   │   ├── code.types.ts
│   │   └── matching.types.ts
│   └── utils/                 # Utility functions
│       ├── api.utils.ts
│       ├── code.utils.ts
│       └── matching.utils.ts
├── .env                       # Environment variables
├── package.json
├── tsconfig.json              # TypeScript config
└── Dockerfile                 # For containerization
```
