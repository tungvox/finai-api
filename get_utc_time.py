import datetime

local_time = datetime.datetime.now()
utc_time = datetime.datetime.utcnow()

print(f"Local time: {local_time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"UTC time: {utc_time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"Timezone offset: {local_time.utcoffset()}") 