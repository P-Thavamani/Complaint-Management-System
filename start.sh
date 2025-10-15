#!/bin/bash
cd backend
pip install -r requirements.txt
gunicorn app:app --bind 0.0.0.0:$PORT