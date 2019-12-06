#!/usr/bin/env bash

command -v sshpass >/dev/null 2>&1 || { echo >&2 "This script requires sshpass, which is not installed on this system"; exit 1; }
command -v git >/dev/null 2>&1 || { echo >&2 "This script requires git, which is not installed on this system"; exit 1; }

# Compress files
printf "Zipping...\n";
git archive -o app.zip -9 HEAD


# Upload file
printf "Uploading...\n";
sshpass -p $2 scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ./app.zip $1:$3 2> /dev/null

printf "Extracting and running npm install...\n"
sshpass -p $2 ssh -o StrictHostKeyChecking=no $1 "source ~/.profile; cd $3; unzip -o ./app.zip; node -v; npm ci; pm2 restart khidmat-api; exit 0"

printf "Done!\n"

exit 0;
