mutation {
  createUser(
    fullname: "John Doe",
    email: "john.doe@example.com",
    password: "password123",
    dob: "1990-01-01",
    phone: "1234567890",
    address: "123 Main St",
    city: "Anytown",
    postcode: "12345",
    admin: true
  ) {
    id
    fullname
    email
    dob
    phone
    address
    city
    postcode
    admin
  }
}

query GetUserById {
  user(id: 1) {
    id
    fullname
    email
    dob
    phone
    address
    city
    postcode
    admin
  }
}


mutation {
  loginUser(
    email: "john.doe@example.com",
    password: "password123"
  ) {
    token
    user {
      id
      fullname
      email
      admin
    }
  }
}


mutation {
  requestPasswordReset(email: "user@example.com") {
    message
  }
}

mutation {
  resetPassword(
    token: "f690297d-1340-495d-9640-baa01da0afd2",
    newPassword: "password"
  ) {
    message
  }
}

query GetAllUsers {
  users {
    id
    fullname
    email
    dob
    phone
    address
    city
    postcode
    admin
  }
}