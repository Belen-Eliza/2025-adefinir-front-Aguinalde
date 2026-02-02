import os
from supabase import create_client, Client, ClientOptions
from dotenv import load_dotenv

load_dotenv()



supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_PUBLISHABLE_KEY"),
    
)



response = supabase.table('Alumno_Insignia').select("*").execute()
s =supabase.auth.get_claims()

print(response.data)
print(s)


supabase.auth.sign_out()


#edge functions https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/restful-tasks/index.ts#L78