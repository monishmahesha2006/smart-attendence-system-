import pytest
from core.auth import verify_password, get_password_hash, create_access_token, _decode_token

def test_password_hashing():
    pw = "SecretP@ssword123"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    data = {"sub": "test@college.edu", "role": "super_admin"}
    token = create_access_token(data)
    assert isinstance(token, str)
    decoded = _decode_token(token)
    assert decoded.email == "test@college.edu"
    assert decoded.role == "super_admin"

def test_login_success_admin(client):
    response = client.post(
        "/auth/login",
        data={"username": "admin@college.edu", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "super_admin"

def test_login_success_teacher(client):
    response = client.post(
        "/auth/login",
        data={"username": "sarah.t@college.edu", "password": "Teacher@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "teacher"

def test_login_invalid_password(client):
    response = client.post(
        "/auth/login",
        data={"username": "admin@college.edu", "password": "WrongPassword"}
    )
    assert response.status_code == 400
    assert "Incorrect" in response.json()["detail"]

def test_login_nonexistent_user(client):
    response = client.post(
        "/auth/login",
        data={"username": "unknown@college.edu", "password": "Password123"}
    )
    assert response.status_code == 400
