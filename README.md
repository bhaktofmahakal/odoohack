# Expense Management Platform

A modern, full-stack expense management platform built with Next.js, TypeScript, and Prisma. Streamline your company's expense reimbursement process with automated workflows, OCR receipt scanning, and flexible approval rules.

## 🚀 Features

### 🔐 Authentication & User Management
- **Auto-setup**: First login creates Company and Admin user automatically
- **Role-based access**: Admin, Manager, and Employee roles
- **User management**: Admins can create and manage employees and managers
- **Manager relationships**: Define reporting hierarchies

### 💰 Expense Management
- **Easy submission**: Employees can submit expenses with amount, category, description, and date
- **Multi-currency support**: Handle expenses in different currencies with automatic conversion
- **OCR Integration**: Scan receipts to auto-populate expense details
- **Expense tracking**: View history with approval status (Approved, Rejected, Pending)

### ⚡ Advanced Approval Workflows
- **Multi-level approvals**: Define sequential approval steps
- **Conditional rules**: 
  - Percentage-based approvals (e.g., 60% of approvers)
  - Specific approver rules (e.g., CFO auto-approval)
  - Hybrid combinations
- **Smart routing**: Expenses automatically move through approval chain
- **Comments & feedback**: Approvers can add comments when approving/rejecting

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production ready)
- **Authentication**: NextAuth.js
- **Testing**: Playwright for E2E testing
- **OCR**: Google Cloud Vision API
- **Currency**: Real-time exchange rates via ExchangeRate API

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud account (for OCR features)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd odoohack
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google Cloud Vision (for OCR)
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"

# Currency API (optional)
EXCHANGE_API_KEY="your-exchange-rate-api-key"
```

### 3. Database Setup
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to get started!

## 📖 Usage Guide

### For Admins
1. **First Time Setup**: Sign up to auto-create your company
2. **Add Users**: Create employee and manager accounts
3. **Configure Approval Rules**: Set up approval workflows and thresholds
4. **Manage Settings**: Configure company currency and approval policies

### For Employees  
1. **Submit Expenses**: Add expenses manually or scan receipts
2. **Track Status**: Monitor approval progress in real-time
3. **View History**: Access all past expense submissions

### For Managers
1. **Review Expenses**: View team expenses awaiting approval
2. **Approve/Reject**: Make decisions with optional comments
3. **Team Overview**: Monitor team expense patterns

## 🧪 Testing

### Run E2E Tests
```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View reports
npm run test:e2e:report
```

### Test Coverage
- Authentication flows
- Expense submission and approval
- Admin functionalities
- API integrations
- Navigation and UI interactions

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard pages
│   └── ...
├── components/         # Reusable components
│   └── ui/            # UI components
├── lib/               # Utility libraries
│   ├── auth.ts        # Authentication config
│   ├── db.ts          # Database client
│   ├── ocr.ts         # OCR functionality
│   └── ...
└── types/             # TypeScript type definitions

tests/                 # Playwright E2E tests
prisma/               # Database schema and migrations
```

## 🔧 API Integration

### Country & Currency Data
- **Endpoint**: `https://restcountries.com/v3.1/all?fields=name,currencies`
- **Usage**: Auto-populate country currency settings

### Exchange Rates
- **Endpoint**: `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}`
- **Usage**: Real-time currency conversion for multi-currency expenses

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Docker
```bash
# Build image
docker build -t expense-management .

# Run container
docker run -p 3000:3000 expense-management
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review test files for usage examples

---

Built with ❤️ using Next.js and TypeScript