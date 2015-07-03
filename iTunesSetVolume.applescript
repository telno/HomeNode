property volumeLevel : 20

tell application "iTunes"
	set sound volume to volumeLevel
	return "done"
end tell

