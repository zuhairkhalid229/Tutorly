
# Tutorly - Online Tutoring Platform

Tutorly is a comprehensive online tutoring platform that connects students with expert tutors across various subjects. The application facilitates booking lessons, managing profiles, conducting sessions, and handling payments.

## Features

### User Authentication
- Separate registration flows for students and tutors
- Email/password authentication
- Profile management
- Role-based access (student, tutor, admin)

### Student Features
- Browse tutors by subject
- View tutor profiles and reviews
- Book tutoring sessions
- Manage upcoming and past bookings
- Message tutors
- Add funds to account
- View payment history

### Tutor Features
- Create and manage profile
- Set availability
- Accept/decline booking requests
- Message students
- Complete subject verification tests
- Track earnings and payment history

### Admin Features
- Manage user accounts (activate/deactivate)
- Approve tutor verification
- Process payment requests
- View platform analytics

### Additional Features
- Real-time messaging
- Payment processing
- Review system for tutors
- Subject verification tests for tutors
- Responsive design for all devices

## Technology Stack

### Frontend
- React with TypeScript
- React Router for navigation
- TanStack Query for data fetching
- Tailwind CSS for styling
- Shadcn UI component library
- Lucide React for icons

### Backend
- Supabase for backend services
- PostgreSQL database
- Supabase Auth for authentication
- Supabase Storage for file storage
- Row Level Security for data protection

## Database Schema

### Tables
1. **profiles** - User profile information
   - id (references auth.users)
   - full_name
   - email
   - role (student, tutor, admin)
   - profile_image
   - about
   - education
   - subjects
   - is_verified
   - phone
   - rating
   - hourly_rate
   - created_at
   - updated_at

2. **bookings** - Tutoring session bookings
   - id
   - student_id
   - tutor_id
   - subject
   - start_time
   - end_time
   - status (pending, confirmed, completed, cancelled)
   - notes
   - price
   - created_at
   - updated_at

3. **payments** - Payment records
   - id
   - payer_id
   - payee_id
   - amount
   - payment_method
   - status (pending, completed, failed, refunded)
   - booking_id
   - created_at
   - processed_at

4. **messages** - User-to-user messages
   - id
   - sender_id
   - receiver_id
   - content
   - is_read
   - created_at

## Project Structure

```
tutorly/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── student/     # Student pages
│   │   └── tutor/       # Tutor pages
│   ├── services/        # API service functions
│   └── types/           # TypeScript type definitions
└── public/              # Static assets
```

## How to Run Locally

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open your browser and go to http://localhost:5173

## Authentication Flow

1. User registers as either a student or tutor
2. On successful registration, a profile is automatically created
3. Students are immediately verified, while tutors require verification
4. Tutors must pass a subject expertise test to be verified
5. Once verified, tutors can accept booking requests

## Booking Flow

1. Student browses tutors and selects one
2. Student creates a booking request with subject, date, and time
3. Tutor receives notification and can accept or decline
4. Once accepted, the payment is processed
5. Both parties can view the booking details
6. After the session, the booking can be marked as completed

## Payment System

1. Students add funds to their account
2. When a booking is confirmed, funds are transferred to the tutor
3. Admin approves payment withdrawals
4. Transaction history is maintained for all users

## Future Enhancements

1. Video calling integration for online sessions
2. Calendar integration
3. Group tutoring sessions
4. AI-powered tutor matching
5. Mobile app versions

## Contact

For questions or support, contact support@tutorly.com
