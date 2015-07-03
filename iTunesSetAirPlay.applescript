property broadcast : "false"

tell application "iTunes"
	if broadcast is "true" or broadcast is "on" then
		set airDevices to every AirPlay device whose available is true and supports audio is true
		repeat with dev in airDevices
			set sound volume of dev to 20
		end repeat
		set current AirPlay devices to airDevices
		return "broadcasting to all AirPlay devices at " & (get sound volume) & "% volume"
	else
		set current AirPlay devices to the first AirPlay device
		return "AirPlay broadcasting off"
	end if
end tell
