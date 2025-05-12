
# Tutorly - Project Documentation

## Overview
Tutorly is an online tutoring platform that connects students with qualified tutors. The platform enables students to find tutors based on subject expertise, book tutoring sessions, and manage their learning journey. Tutors can create profiles, set availability, and provide personalized instruction.

## User Roles

### 1. Student
Students can:
- Register and create profiles
- Browse and search for tutors by subject
- View tutor profiles, credentials, and reviews
- Book tutoring sessions
- Manage bookings (view upcoming/past sessions, cancel sessions)
- Message tutors
- Add funds to their account
- Pay for tutoring sessions
- Leave reviews for tutors after completed sessions

### 2. Tutor
Tutors can:
- Register and create detailed professional profiles
- Take subject verification tests to prove expertise
- Set availability and hourly rates
- Accept or decline booking requests
- Manage their schedule of sessions
- Message students
- Receive payments for completed sessions
- Track earnings and payment history

### 3. Admin
Administrators can:
- Approve tutor verification requests
- Manage user accounts (activate/deactivate)
- Process payment transactions
- View platform analytics and reports
- Resolve disputes and issues

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: React Router v6
- **State Management**: React Context API + TanStack Query
- **UI Components**: Shadcn UI + Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation

### Backend
- **Platform**: Supabase (Backend as a Service)
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Security**: Row Level Security policies

## Database Schema

### 1. profiles
- **id**: UUID (FK to auth.users)
- **full_name**: TEXT
- **email**: TEXT
- **profile_image**: TEXT (URL)
- **phone**: TEXT
- **about**: TEXT
- **education**: TEXT
- **role**: TEXT ('student', 'tutor', 'admin')
- **subjects**: TEXT[] (array of subject names)
- **is_verified**: BOOLEAN
- **rating**: FLOAT
- **hourly_rate**: DECIMAL
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### 2. bookings
- **id**: UUID
- **student_id**: UUID (FK to auth.users)
- **tutor_id**: UUID (FK to auth.users)
- **subject**: TEXT
- **start_time**: TIMESTAMP
- **end_time**: TIMESTAMP
- **status**: TEXT ('pending', 'confirmed', 'completed', 'cancelled')
- **notes**: TEXT
- **price**: DECIMAL
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### 3. payments
- **id**: UUID
- **payer_id**: UUID (FK to auth.users)
- **payee_id**: UUID (FK to auth.users)
- **amount**: DECIMAL
- **payment_method**: TEXT
- **status**: TEXT ('pending', 'completed', 'failed', 'refunded')
- **booking_id**: UUID (FK to bookings)
- **created_at**: TIMESTAMP
- **processed_at**: TIMESTAMP

### 4. messages
- **id**: UUID
- **sender_id**: UUID (FK to auth.users)
- **receiver_id**: UUID (FK to auth.users)
- **content**: TEXT
- **is_read**: BOOLEAN
- **created_at**: TIMESTAMP

## Core Workflows

### 1. User Registration
1. User selects role (student or tutor)
2. User provides email, password, and basic information
3. Account is created in auth.users
4. Profile record is created in profiles table
5. Students are automatically verified
6. Tutors require verification through subject expertise tests

### 2. Booking Process
1. Student searches for tutors by subject
2. Student views tutor profiles and selects a tutor
3. Student creates a booking request with subject, date, and time
4. Request is saved with status "pending"
5. Tutor receives notification of booking request
6. Tutor accepts or declines request
7. If accepted, payment is processed and booking status becomes "confirmed"
8. After the session, booking status can be updated to "completed"

### 3. Payment Flow
1. Student adds funds to account
2. When booking is confirmed, funds are transferred to tutor account
3. Payment record is created with "completed" status
4. Tutor can request withdrawal of funds
5. Admin approves withdrawal request
6. Transaction is processed and recorded

### 4. Tutor Verification
1. Tutor signs up and completes profile
2. Tutor selects subjects they want to teach
3. For each subject, tutor takes a verification test
4. Test is evaluated (automatically or by admin)
5. If passed, tutor is verified for that subject
6. Tutor profile is updated with verified status

## Security Considerations

### 1. Authentication
- Secure email/password authentication through Supabase Auth
- Password reset functionality
- Token-based session management

### 2. Data Access Control
- Row Level Security policies for all tables
- Students can only view their own bookings and messages
- Tutors can only view/modify their own profile and bookings
- Admin has elevated privileges for managing users and payments

### 3. Payment Security
- Secure handling of payment information
- Transaction records are protected with proper access control
- Payment processing isolated from general application logic

## API Services

### 1. Profile Services
- `getProfile`: Fetch user profile details
- `updateProfile`: Update profile information
- `uploadProfileImage`: Upload and store profile picture
- `getTutors`: Get list of available tutors
- `getTutorById`: Get detailed information about a specific tutor

### 2. Booking Services
- `createBooking`: Create a new booking request
- `confirmBooking`: Accept a booking request
- `completeBooking`: Mark booking as completed
- `cancelBooking`: Cancel a booking
- `getStudentBookings`: Fetch bookings for a student
- `getTutorBookings`: Fetch bookings for a tutor
- `getBookingDetails`: Get detailed information about a specific booking

### 3. Payment Services
- `addFunds`: Add funds to student account
- `bookTutor`: Process payment for booking
- `getPaymentHistory`: Get payment history for a user
- `getPendingPayments`: Get pending payment requests
- `approvePayment`: Approve a payment

### 4. Message Services
- `sendMessage`: Send message to another user
- `getConversations`: Get list of conversations
- `getMessages`: Get messages in a conversation
- `markAsRead`: Mark messages as read

### 5. AI Test Services
- `getAITest`: Generate AI test for subject verification
- `submitTestAnswers`: Submit and evaluate test answers
- `checkTutorVerification`: Check if tutor is verified for subjects

## Testing Strategy

### 1. Unit Testing
- Test individual components and services
- Verify correct rendering and functionality
- Mock API calls and state changes

### 2. Integration Testing
- Test interactions between components and services
- Verify data flows correctly through the application
- Test form submissions and API interactions

### 3. End-to-End Testing
- Test complete user workflows
- Verify authentication, booking, and payment processes
- Test across different devices and browsers

## Deployment

### Development
- Local development using Vite dev server
- Environment variables for configuration
- Local Supabase instance for development

### Production
- Build optimized production bundle
- Deploy frontend to static hosting (e.g., Vercel, Netlify)
- Connect to production Supabase instance
- Set up monitoring and error tracking

## Future Enhancements

1. **Video Conferencing Integration**
   - Built-in video calling for tutoring sessions
   - Screen sharing and whiteboard functionality

2. **Advanced Scheduling**
   - Calendar integration with Google/Outlook
   - Recurring session booking
   - Availability preferences for tutors

3. **Learning Materials Management**
   - Upload and share study materials
   - Collaborative document editing
   - Assignment submission and grading

4. **Mobile Applications**
   - Native iOS and Android apps
   - Push notifications for bookings and messages

5. **Analytics and Reporting**
   - Student progress tracking
   - Tutor performance metrics
   - Platform usage analytics
