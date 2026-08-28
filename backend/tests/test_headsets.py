"""Tests for the /headsets endpoints."""


class TestListHeadsets:
    def test_list_headsets_empty(self, client):
        resp = client.get("/headsets/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_headsets_with_data(self, client, seed_data):
        resp = client.get("/headsets/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        codes = [h["code"] for h in data]
        assert codes == sorted(codes)  # sorted by code

    def test_headset_response_shape(self, client, seed_data):
        resp = client.get("/headsets/")
        data = resp.json()
        for h in data:
            assert "id" in h
            assert "code" in h
            assert "model" in h
            assert "is_active" in h


class TestGetHeadset:
    def test_get_existing_headset(self, client, seed_data):
        headset_id = seed_data["headsets"][0].id
        resp = client.get(f"/headsets/{headset_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == "DZ1"
        assert data["model"] == "Meta Quest 3"
        assert data["is_active"] is True

    def test_get_nonexistent_headset_returns_404(self, client):
        resp = client.get("/headsets/9999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Headset not found"
