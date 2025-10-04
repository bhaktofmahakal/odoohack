export interface User {
  id: string
  email: string
  name: string
  image?: string
  role: UserRole
  companyId: string
  managerId?: string
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export interface Company {
  id: string
  name: string
  currency: string
  country: string
  createdAt: Date
  updatedAt: Date
}

export interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  currency: string
  convertedAmount?: number // in company's base currency
  category: ExpenseCategory
  date: Date
  receiptUrl?: string
  status: ExpenseStatus
  submitterId: string
  submitter: User
  companyId: string
  approvalFlow?: ApprovalFlow
  createdAt: Date
  updatedAt: Date
}

export enum ExpenseCategory {
  TRAVEL = 'TRAVEL',
  MEALS = 'MEALS',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  MARKETING = 'MARKETING',
  TRAINING = 'TRAINING',
  UTILITIES = 'UTILITIES',
  OTHER = 'OTHER'
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED'
}

export interface ApprovalFlow {
  id: string
  expenseId: string
  steps: ApprovalStep[]
  currentStepIndex: number
  status: ExpenseStatus
  createdAt: Date
  updatedAt: Date
}

export interface ApprovalStep {
  id: string
  flowId: string
  stepNumber: number
  approvers: User[]
  requiredApprovals: number // for percentage rules
  specificApproverId?: string // for specific approver rules
  rule: ApprovalRule
  approvals: Approval[]
  status: ApprovalStepStatus
  createdAt: Date
}

export enum ApprovalStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED'
}

export interface ApprovalRule {
  id: string
  name: string
  type: ApprovalRuleType
  percentage?: number // for percentage rules
  specificApproverId?: string // for specific approver rules
  hybrid?: {
    percentage: number
    specificApproverId: string
  }
}

export enum ApprovalRuleType {
  PERCENTAGE = 'PERCENTAGE',
  SPECIFIC = 'SPECIFIC',
  HYBRID = 'HYBRID'
}

export interface Approval {
  id: string
  stepId: string
  approverId: string
  approver: User
  status: ApprovalStatus
  comment?: string
  createdAt: Date
}

export enum ApprovalStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface CurrencyRate {
  from: string
  to: string
  rate: number
  timestamp: Date
}

export interface OCRResult {
  amount?: number
  currency?: string
  date?: string
  merchant?: string
  category?: ExpenseCategory
  confidence: number
}

export interface Country {
  name: {
    common: string
    official: string
  }
  currencies: {
    [key: string]: {
      name: string
      symbol?: string
    }
  }
}

export interface UserLocation {
  city: string
  region: string
  country: string
  countryCode: string
  currency: string
  timezone: string
}

// Analytics types
export interface ExpenseAnalytics {
  totalSpend: number
  pendingAmount: number
  approvedAmount: number
  averageApprovalTime: number
  topCategories: CategorySpend[]
  monthlyTrend: MonthlyTrend[]
}

export interface CategorySpend {
  category: ExpenseCategory
  amount: number
  count: number
}

export interface MonthlyTrend {
  month: string
  amount: number
  count: number
}

// Form types
export interface ExpenseFormData {
  title: string
  description?: string
  amount: number
  currency: string
  category: ExpenseCategory
  date: Date
  receipt?: File
}

export interface UserFormData {
  name: string
  email: string
  role: UserRole
  managerId?: string
}