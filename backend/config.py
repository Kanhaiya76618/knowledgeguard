from dotenv import load_dotenv
import os

load_dotenv()

BOB_CMD = os.getenv('BOB_CMD', 'bob')
BOB_API_KEY = os.getenv('BOB_API_KEY', '')
BOB_API_URL = os.getenv('BOB_API_URL', 'https://api.us-east.bob.ibm.com')
TEMP_DIR = os.getenv('TEMP_DIR', os.path.join(os.path.expanduser('~'),
                      'AppData', 'Local', 'Temp', 'knowledgeguard'))
MAX_CLONE_SIZE_MB = int(os.getenv('MAX_CLONE_SIZE_MB', '500'))
CLONE_TIMEOUT = int(os.getenv('CLONE_TIMEOUT_SECONDS', '120'))
BOB_TIMEOUT = int(os.getenv('BOB_TIMEOUT_SECONDS', '180'))

os.makedirs(TEMP_DIR, exist_ok=True)
