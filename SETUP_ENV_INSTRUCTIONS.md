# Setting Up Environment Variables for Cerebro

## Important: Securing Your API Keys

To use the OpenAI API with your chatbot, you'll need to set up environment variables to keep your API key secure and out of your codebase.

### Step 1: Create or Update Your .env.local File

1. Create a file named `.env.local` in the root directory of your project:

```
OPENAI_API_KEY=your_openai_api_key_here
```

2. Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Step 2: Add .env.local to .gitignore

Make sure your `.gitignore` file includes:

```
# environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### Step 3: Restart Your Development Server

After adding your environment variables, restart your development server to apply the changes:

```
npm run dev
```

### Important Security Notes

- **NEVER** commit your API keys to your repository
- **NEVER** share your API keys in client-side code
- When deploying, set up environment variables in your hosting platform (Vercel, Netlify, etc.)
- Rotate your API keys regularly for security
- Consider setting up usage limits on your OpenAI account to prevent unexpected charges

For production, consider using a more secure method for storing secrets, such as a secrets manager service.
