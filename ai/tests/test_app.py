import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    resp = client.get('/health')
    assert resp.status_code == 200
    assert resp.json['status'] == 'ok'

def test_predict_no_data(client):
    resp = client.post('/predict', json={'transactions': []})
    assert resp.status_code == 200
    assert resp.json['predictions'] is None

def test_chat(client):
    resp = client.post('/chat', json={
        'message': 'How can I save money?',
        'context': {'transactions': []}
    })
    assert resp.status_code == 200
    assert 'reply' in resp.json
