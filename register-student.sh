#!/bin/bash

echo "=== Student Registration Tool ==="
echo "Server: http://localhost:3000"
echo ""

read -p "Enter student's first name: " firstname
read -p "Enter student's last name: " lastname
read -p "Enter student's email: " email
read -s -p "Enter password (minimum 8 characters): " password
echo ""
read -p "Enter phone number (optional): " phone

echo ""
echo "Registering student..."

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$email\",
    \"password\": \"$password\",
    \"firstName\": \"$firstname\",
    \"lastName\": \"$lastname\",
    \"role\": \"STUDENT\",
    \"phone\": \"$phone\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Registration response received"

echo ""
echo "Registration completed!"
