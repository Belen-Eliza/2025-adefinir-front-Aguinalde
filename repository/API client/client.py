import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY"),
    
)

response = supabase.table('Motivos_Insignia').select("*").execute()

print(response.data)

