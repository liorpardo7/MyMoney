#### Environment Variables
Create a `.env.local` file:
```env
# BigQuery Configuration
GOOGLE_CLOUD_PROJECT_ID=mymoney-470619
GOOGLE_CLOUD_DATASET=mymoney
GOOGLE_APPLICATION_CREDENTIALS=./mymoney-470619-2f22e813a9d7.json
GOOGLE_CLOUD_LOCATION=US

# OpenAI API Key for GPT-5 statement parsing
OPENAI_API_KEY=your_openai_api_key_here

# App Security
VAULT_PASSCODE=your_secure_passcode

# Server Configuration
PORT=7777
NEXT_PUBLIC_API_URL=http://localhost:7777
```

**Note**: We now use only one environment file (`.env.local`) to prevent confusion when working on multiple projects.
