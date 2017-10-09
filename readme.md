# charloop

> An audio loop recorder for raspberry pi.

## App

### Dev

```
npm run watch
npm run client:start
npm run server:start
```

### Production

```
npm run build
```

## Raspberry Pi

1. Download the Lite version of Raspbian and copy to an SD card. You want the Lite version because it comes with a lot less crap and we can just install what we need instead.
1. Set up your raspberry pi.
1. Install these packages:

    ```
    apt-get install vim git
    ```

1. Install node (might need to change the wget URL here to a newer version):

    ```
    wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.4/install.sh | bash
    # you might need to re-login here to get nvm in your path
    nvm install stable
    # this installed version 8.5.0 for me
    ```

1. Make sure the user you're running as is a member of the `gpio` group:

    ```
    usermod -aG gpio username
    ```

## Rotary Encoder

The rotary encoder I have ([https://www.adafruit.com/product/377](https://www.adafruit.com/product/377)) has two leads for the push-button and three for the rotary encoder.  Apparently the three rotary encoder pins use Gray code.

### Pinout

```
 button   button
+--|---------|--+
|               |
|               |
|               |
+--|----|----|--+
   L   GND   R
```

### Gray Code

I'm not sure if this is really Gray code. It's just what I figured out messing around with the encoder. I have my `L` and `R` pins set high initially. This is the process I used for reading the code from the encoder:

1. Both pins start high and will remain high until the encoder is turned.
1. One pin goes low: a turn has been initiated (it doesn't matter which pin goes low)
1. Both pins are low: about to get the direction the encoder turned.
1. One pin goes high:
    - If `L` goes high, it's a clockwise turn
    - If `R` goes high, it's a counter-clockwise turn
1. Both pins will go high again and everything resets.

Here are graphs of the patterns. You'll notice that they both pins start and end high; the reset state.

```
Clockwise turn

L / -__--
R / --__-

States

L1, R1
L0, R1
L0, R0
L1, R0
L1, R1

```

```
Counter-clockwise turn

L / --__-
R / -__--

States

L1, R1
L1, R0
L0, R0
L0, R1
L1, R1
```

This lets you build a state machine that works with `rpio`'s polling mechanism, where the direction is read at the end, just before both pins go high again.

## TFT Display

1. These are the pin connections I used:

    Description | TFT Pin | Raspi Pin
    --- | --- | ---
    TFT Data Out (MISO) | 33 | 21
    Clock (SCLK) | 37 | 23
    TFT Data In (MOSI) | 34 | 19
    D/C | 36 | 18
    Reset | 10 | 16
    Chip Select | 38 | 24

1. See list of supported devices for module:

    ```
    sudo modprobe fbtft_device name=list; dmesg | tail -50
    ```

    We want `adafruit28`

1. Edit `/etc/modprobe.d/fbtft.conf` and add the following:

    ```
    options fbtft_device name=adafruit28 cs=0 gpios=reset:23,dc:24 rotate=0
    ```

1. Edit `/etc/modules-load.d/fbtft.conf` and add:

    ```
    spi-bcm2835
    fbtft_device
    ```

1. Add the following the end of the line in `/boot/cmdline.txt` (right after `rootwait`)

    ```
    fbcon=map:10 fbcon=font:VGA8x8 logo.nologo
    ```

1. For a better console font: `sudo dpkg-reconfigure console-setup` and select: _UTF 8 &gt; Guess optimal... &gt; Terminus &gt; 6x12_

1. Turn on console output: `sudo con2fbmap 1 1`

1. Restart

### Sending text to the screen via SSH

To output to the screen, modify permissions on `/dev/tty1`:

```
sudo chmod 666 /dev/tty1
```

Send text to the screen via ssh:

```
echo -ne "asdf" > /dev/tty1
```

Wake the screen up if it's gone to sleep:

```
echo -ne "\033[9;0]" > /dev/tty1
```

Clear the screen:

```
echo -ne "\033[2J" > /dev/tty1
```

Disable the blinking cursor:

```
echo -ne '\033[?17;0;0c' > /dev/tty1
```

### Disable screen blanking/sleep

Edit `/boot/cmdline.txt` and add this to the end of the line:

```
consoleblank=0
```

## Startup

I set things up to login to a specific user on startup and run the project app.

1. Automatically login to the `app` user, edit `/etc/systemd/system/getty.target.wants/getty@tty1.service` and add this line under `[Service]`:

    ```
    ExecStart=-/sbin/agetty --autologin app --noclear %I $TERM
    ```

1. Enable the service: `systemctl enable getty@tty1`

1. Run a specific program, add this to end of `app`'s `.bashrc` file:

    ```
    # clear the screen
    echo -ne "\033[2J"
    # start the app
    cd /home/app/charloop && node app.js
    ```

### Custom boot splash screen

1. Install `fbi`: `apt-get install fbi`

1. Create `/etc/systemd/system/splashscreen.service` with:

    ```
    [Unit]
    Description=Splash screen
    DefaultDependencies=no
    After=local-fs.target

    [Service]
    ExecStart=/usr/bin/fbi --noverbose -a /opt/splash.png
    StandardInput=tty
    StandardOutput=tty

    [Install]
    WantedBy=sysinit.target
    ```

1. Copy your splash image to `/opt/splash.png`. Make it `240x320` to exactly fit the screen.

1. Enable the service: `systemctl enable splashscreen`

### Remove boot/shutdown text

1. This might remove some: edit `/boot/cmdline.txt` and add:

    ```
    quiet loglevel=3
    ```

1. This will clear the screen after everything else is run, so at least you see less text after the splash screen goes away. Add this to the end of `etc/rc.local`:

    ```
    # clears the screen
    echo -ne "\033[2J"
    ```

1. Disable the motd. Edit `/etc/pam.d/login`, comment out these lines:

    ```
    #session    optional   pam_lastlog.so
    #session    optional   pam_motd.so motd=/run/motd.dynamic
    #session    optional   pam_motd.so noupdate
    #session    optional   pam_mail.so standard
    ```

1. Remove some extra login messages and clear the screen on the login prompt:

    ```
    sudo su -
    clear > /etc/issue
    ```

## Parts List

- [Raspberry Pi 3 - Model B](https://www.adafruit.com/product/3055)
- [Analog to Digital Converter - MCP3002](https://www.sparkfun.com/products/8636)
- [SparkFun microB USB Breakout](https://www.sparkfun.com/products/12035)
- [2.8" TFT Display with Resistive Touchscreen](https://www.adafruit.com/product/1774)
- [Adafruit 50 pin 0.5mm pitch FPC Adapter](https://www.adafruit.com/product/1492). The pin numbering on this is reversed from what the pins will actually be when you plug in the ribbon cable for the 2.8" display. This may not be true of all displays, so check the ribbon cable and connector before soldering stuff.
- [50-pin 0.5mm pitch top-contact FPC SMT Connector](https://www.adafruit.com/product/1773)
- [Rotary Encoder](https://www.adafruit.com/product/377)
- [Rail-to-Rail Op Amp](https://www.adafruit.com/product/808)

## References

### Raspberry Pi

- [Copy image to SD card (Mac)](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md)
- [Enable headless SSH](https://hackernoon.com/raspberry-pi-headless-install-462ccabd75d0)
- [Set up Chromium kiosk mode on Raspbian Lite](https://tamarisk.it/raspberry-pi-kiosk-mode-using-raspbian-lite/)
- [Raspberry Pi pinout](https://pinout.xyz/)
- [A guitar pedal made with Raspberry Pi](https://www.electrosmash.com/pedal-pi)
- [Guitar pedal curcuit diagram](https://www.electrosmash.com/forum/pedal-pi/206-pedal-pi-circuit-analysis)

### Node

- [Installing nvm on Raspberry Pi](https://github.com/creationix/nvm)
- [Raspi node library (node-rpio)](https://github.com/jperkin/node-rpio)

### TFT Display

- [TFT display using a module](https://github.com/notro/fbtft/wiki/fbtft_device)
- [Set up a TFT display using Raspi, without kernel compile/module](https://www.raspberrypi.org/forums/viewtopic.php?p=1041032&sid=4cb043cb2d40b23e2e3464e0885018fe#p1041032)
- [Another setup TT display](http://lallafa.de/blog/2015/03/fbtft-setup-on-modern-raspbian/)
- [Some guy using a TFT display with a Raspi](http://www.whence.com/rpi/)
- [Adafruit breakout board for the TFT display I used](https://www.adafruit.com/product/1770)
- [Schematic for the Adafruit breakout board](https://learn.adafruit.com/adafruit-2-8-tft-touch-shield-v2/downloads)
- [Using the Adafruit breakout board/pinout/wiring](https://learn.adafruit.com/adafruit-2-dot-8-color-tft-touchscreen-breakout-v2/)

### Startup

- [Create a splash screen](https://yingtongli.me/blog/2016/12/21/splash.html)

### WAV Files

- WAV file format
    - [http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html](http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html)
    - [http://www.topherlee.com/software/pcm-tut-wavformat.html](http://www.topherlee.com/software/pcm-tut-wavformat.html)
    - [http://soundfile.sapp.org/doc/WaveFormat/](http://soundfile.sapp.org/doc/WaveFormat/)
- [SoX linux command](http://sox.sourceforge.net/sox.html)
- [A node library that uses SoX. Code is a good reference for that command.](https://github.com/substack/baudio)


