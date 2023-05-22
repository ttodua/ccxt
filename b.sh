
ff () {
  search_dir=./
  for entry in "$search_dir"/*
  do
    echo "$entry"
  done
}


echo "zzz091"

node a.js
echo "zzz092"

which node
which nodejs
echo "zzz10"
npm root -g
"C:\\Program Files (x86)\\nodejs\\npm" root -g
cd "C:\\Program Files (x86)\\nodejs\\"
ff
cd "/usr/"
ff
#%USERPROFILE%\AppData\Roaming\npm\node_modules
#set path=%PATH%;%CD%
#setx path "%PATH%"
#echo $PATH
which npm
which node
echo "zzz11"
npm --version
echo "zzz22"