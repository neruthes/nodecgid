# Nodejs CGI Daemon (nodecgid)


## Usage

This program will work as a webserver which listens 9345.

### Sample Configuration

#### /etc/nginx/sites-enabled/example.conf

```nginx
server {
    listen 80;
    server_name nas.ndlt6g.lan;
    root /srv/myNAS;
    location ~ /$ {
        proxy_set_header wwwroot $document_root;
        proxy_set_header rawhost $host;
        proxy_set_header host 'coolaltindex-nodecgid.com';
        proxy_pass http://127.0.0.1:9345;
    }
}
```

#### /etc/nodecgid/config.json

```jsonc
{
    "port": 9345        // Specify a port; default is 9345
}
```

#### /etc/nodecgid/applets.json

```jsonc
{
    "coolaltindex-nodecgid.com": "/usr/bin/node /home/neruthes/DEV/coolaltindex/coolaltindex-nodecgid.js"
}
```


### How It Works

#### Startup

Upon startup, this program will read `/etc/nodecgid/applets.json` to get a list of enabled applet daemons.
It will start all the applet daemons (spawning child processes), with env `cgi_pseudohost` and `cgi_portfile`.
An applet daemon shall be a webserver (listening on any arbitrary port); it informs this program its port,
by writing the port number to the specified `cgi_portfile`.

#### Forwarding

This program will receive the `host` header from Nginx, working as `pesudohost` variable.
This `pseudohost` will be used to identify the expected applet, so that HTTP requests may be forwarded to the correct port.









## Copyright

Copyright (c) 2022 Neruthes.

Published with GNU GPLv2.