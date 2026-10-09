import pytest
from core.auth import create_access_token

def auth_headers(email="admin@college.edu", role="super_admin"):
    token = create_access_token({"sub": email, "role": role})
    return {"Authorization": f"Bearer {token}"}

def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ai-attendance-system"

def test_departments_list(client):
    res = client.get("/departments/")
    assert res.status_code == 200
    depts = res.json()
    assert len(depts) >= 1
    assert depts[0]["code"] == "CSE"

def test_create_and_delete_section(client):
    headers = auth_headers()
    # Create section
    payload = {"name": "CSE-A", "year": 3, "department_id": 1}
    create_res = client.post("/sections/", json=payload, headers=headers)
    assert create_res.status_code == 200
    sec = create_res.json()
    assert sec["name"] == "CSE-A"
    sec_id = sec["id"]

    # List sections
    list_res = client.get("/sections/?department_id=1")
    assert list_res.status_code == 200
    assert any(s["id"] == sec_id for s in list_res.json())

    # Delete section
    del_res = client.delete(f"/sections/{sec_id}", headers=headers)
    assert del_res.status_code == 200

def test_cameras_crud(client):
    headers = auth_headers()
    # Create camera
    payload = {"room_name": "Lab 101", "stream_url": "rtsp://camera.local/stream", "section_id": None, "active": True}
    res = client.post("/cameras/", json=payload, headers=headers)
    assert res.status_code == 200
    cam = res.json()
    assert cam["room_name"] == "Lab 101"
    cam_id = cam["id"]

    # List cameras
    res_list = client.get("/cameras/")
    assert res_list.status_code == 200
    assert any(c["id"] == cam_id for c in res_list.json())

    # Delete camera
    res_del = client.delete(f"/cameras/{cam_id}", headers=headers)
    assert res_del.status_code == 200
