
Function build_and_test_all {
    echo "FORCEEE BUILDDDDDD"
    #npm run force-build
}

echo "1111"
echo %APPVEYOR_PULL_REQUEST_NUMBER%
echo "2222"
echo "%APPVEYOR_PULL_REQUEST_NUMBER%"
echo "3333"
echo "$APPVEYOR_PULL_REQUEST_NUMBER"
echo $APPVEYOR_PULL_REQUEST_NUMBER

### CHECK IF THIS IS A PR ###
if ("%APPVEYOR_PULL_REQUEST_NUMBER%"="") {
  echo "This is merger in master, will build everything"
  build_and_test_all
}


##### DETECT CHANGES #####
# temporarily remove the below scripts from diff
# in appveyor, there is no origin/master locally, so we need to fetch it
git remote set-branches origin 'master'
git fetch --depth=1
set diff=$(git diff origin/master --name-only)

echo diff