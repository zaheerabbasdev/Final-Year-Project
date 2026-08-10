# Use Case Diagram — Customer Actor

```mermaid
graph LR
    ACTOR["👤\nCustomer"]

    subgraph SYSTEM["KAARKUN SYSTEM"]

        subgraph AUTH["Authentication"]
            UC1(["Register Account"])
            UC2(["Verify OTP"])
            UC3(["Login"])
            UC4(["Forgot Password"])
            UC5(["Reset Password"])
        end

        subgraph PROFILE["Profile Management"]
            UC6(["View Profile"])
            UC7(["Update Profile"])
            UC8(["Upload Avatar"])
            UC9(["Update Location"])
        end

        subgraph JOBS["Job Management"]
            UC10(["Post a Job"])
            UC11(["View My Jobs"])
            UC12(["View Job Details"])
            UC13(["Cancel Job"])
        end

        subgraph PROVIDERS["Provider Discovery"]
            UC14(["Browse Providers"])
            UC15(["View Provider Profile"])
            UC16(["View Provider Reviews"])
        end

        subgraph BIDS["Bid Management"]
            UC17(["View Bids on Job"])
            UC18(["Accept a Bid"])
            UC19(["Reject a Bid"])
        end

        subgraph BOOKINGS["Booking Management"]
            UC20(["View My Bookings"])
            UC21(["Track Active Booking"])
            UC22(["Complete Booking"])
        end

        subgraph REVIEWS["Review & Rating"]
            UC23(["Submit Review"])
            UC24(["Rate Service Provider"])
        end

        subgraph COMMUNICATION["Communication"]
            UC25(["Chat with Provider"])
            UC26(["Send Image in Chat"])
            UC27(["View Notifications"])
            UC28(["Mark Notifications Read"])
        end

        subgraph SUPPORT["Support"]
            UC29(["Use AI Support Chatbot"])
        end

    end

    %% Authentication
    ACTOR --- UC1
    ACTOR --- UC2
    ACTOR --- UC3
    ACTOR --- UC4
    ACTOR --- UC5

    %% Profile
    ACTOR --- UC6
    ACTOR --- UC7
    ACTOR --- UC8
    ACTOR --- UC9

    %% Jobs
    ACTOR --- UC10
    ACTOR --- UC11
    ACTOR --- UC12
    ACTOR --- UC13

    %% Providers
    ACTOR --- UC14
    ACTOR --- UC15
    ACTOR --- UC16

    %% Bids
    ACTOR --- UC17
    ACTOR --- UC18
    ACTOR --- UC19

    %% Bookings
    ACTOR --- UC20
    ACTOR --- UC21
    ACTOR --- UC22

    %% Reviews
    ACTOR --- UC23
    ACTOR --- UC24

    %% Communication
    ACTOR --- UC25
    ACTOR --- UC26
    ACTOR --- UC27
    ACTOR --- UC28

    %% Support
    ACTOR --- UC29

    %% Include relationships
    UC1 -. "«include»" .-> UC2
    UC4 -. "«include»" .-> UC5
    UC10 -. "«include»" .-> UC12
    UC18 -. "«include»" .-> UC20
    UC22 -. "«include»" .-> UC23
    UC25 -. "«include»" .-> UC26
```

## Customer Use Cases Summary

| # | Use Case | Description |
|---|---|---|
| 1 | Register Account | Sign up with name, email, phone, password and optional profile photo |
| 2 | Verify OTP | Confirm email address via 6-digit one-time password |
| 3 | Login | Authenticate with email and password |
| 4 | Forgot Password | Request OTP to reset a forgotten password |
| 5 | Reset Password | Set a new password using the verified OTP |
| 6 | View Profile | View personal account information |
| 7 | Update Profile | Edit name, phone number and location |
| 8 | Upload Avatar | Change profile photo |
| 9 | Update Location | Set or update geographical location |
| 10 | Post a Job | Create a new service request with title, description, category, budget and location |
| 11 | View My Jobs | List all posted jobs with their statuses |
| 12 | View Job Details | Inspect a single job and its associated bids |
| 13 | Cancel Job | Remove an open job posting |
| 14 | Browse Providers | Discover service providers in the system |
| 15 | View Provider Profile | Inspect a provider's experience, skills and rating |
| 16 | View Provider Reviews | Read reviews left by other customers |
| 17 | View Bids on Job | See all bids submitted by providers for a job |
| 18 | Accept a Bid | Select a provider's bid to create a booking |
| 19 | Reject a Bid | Decline a provider's proposal |
| 20 | View My Bookings | List all active and past bookings |
| 21 | Track Active Booking | Monitor the status of an ongoing service |
| 22 | Complete Booking | Mark a service as completed |
| 23 | Submit Review | Write a review for the service received |
| 24 | Rate Service Provider | Give a star rating to a provider |
| 25 | Chat with Provider | Send and receive real-time messages |
| 26 | Send Image in Chat | Attach and share image files in conversation |
| 27 | View Notifications | Read system and activity notifications |
| 28 | Mark Notifications Read | Dismiss individual or all notifications |
| 29 | Use AI Support Chatbot | Ask the AI assistant for platform help |
