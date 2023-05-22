
ff () {
  search_dir=./
  for entry in "$search_dir"/*
  do
    echo "$entry"
  done
}


echo $PATH
echo "aaaaaaaaaa10"
npm --version
#node a.js
echo "aaaaaaaaaa20"
which node
which nodejs
echo "aaaaaaaaaa30"
npm root -g
"C:\\Program Files (x86)\\nodejs\\npm" root -g
echo "aaaaaaaaaa40"
cd "C:\\Program Files (x86)\\nodejs\\"
ff
echo "aaaaaaaaaa41"
cd "/"
ff
cd "/usr/"
ff
#%USERPROFILE%\AppData\Roaming\npm\node_modules
#set path=%PATH%;%CD%
#setx path "%PATH%"
# #echo $PATH
# which npm
# which node
# echo "zzz11"
# echo "zzz22"