This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Backend API Endpoints

QuickFi includes several API endpoints to facilitate the tokenization of insurance policies and the loan application process:

### File Upload & Processing
- **Endpoint**: `/api/upload`
- **Method**: POST
- **Description**: Uploads insurance policy documents and extracts metadata.
- **Request**: Form data with file upload (PDF, images)
- **Response**: Extracted policy metadata

### Document Validation
- **Endpoint**: `/api/validate`
- **Method**: POST
- **Description**: Validates uploaded insurance policy documents.
- **Request**: JSON with policy metadata
- **Response**: Validation status and enriched metadata

### Tokenization
- **Endpoint**: `/api/tokenize`
- **Method**: POST
- **Description**: Mints an NFT representing the insurance policy using Plume Arc.
- **Request**: JSON with user address and policy metadata
- **Response**: Tokenized policy details

### Loan Application
- **Endpoint**: `/api/loan-apply`
- **Method**: POST
- **Description**: Processes loan applications using Perimeter Protocol.
- **Request**: JSON with token details and loan request parameters
- **Response**: Loan eligibility and terms

### Loan Execution
- **Endpoint**: `/api/execute-loan`
- **Method**: POST
- **Description**: Executes approved loans via Morpho Blue integration.
- **Request**: JSON with approved loan details
- **Response**: Executed loan details

## Architecture

QuickFi uses a modular architecture that integrates several DeFi protocols:

1. **Plume Arc/Nexus**: For tokenizing and valuing insurance policies
2. **Perimeter Protocol**: For risk assessment and loan origination
3. **Morpho Blue**: For loan execution and management

The backend API is built using Next.js API routes, making it easy to deploy on Vercel.

## Environment Variables

This project uses RainbowKit for wallet connection, which requires a WalletConnect project ID for its integration:

1. Create a `.env.local` file in your project root
2. Add the following line:
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

To get a WalletConnect project ID:
1. Go to https://cloud.walletconnect.com/
2. Create an account/sign in
3. Create a new project (select AppKit, not WalletKit)
4. Copy the project ID

This environment variable is required by RainbowKit to enable wallet connection functionality in your DApp.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Free Tier Features
- Unlimited personal projects
- 100GB bandwidth per month
- 100GB storage
- Automatic HTTPS
- Automatic deployments from Git
- Custom domains
- Analytics
- Serverless functions (up to 100GB-hours per month)

### Deployment Steps
1. Sign up for a Vercel account at https://vercel.com
2. Connect your GitHub/GitLab/Bitbucket repository
3. Vercel will automatically detect it's a Next.js project
4. Configure your environment variables:
   - Add your `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` from your `.env.local` file
5. Click "Deploy"

Your site will be live at `https://your-project-name.vercel.app` and will automatically deploy whenever you push changes to your repository.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
