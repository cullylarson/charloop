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

## References

- [Copy image to SD card (Mac)](https://www.raspberrypi.org/documentation/installation/installing-images/mac.md)
- [Enable headless SSH](https://hackernoon.com/raspberry-pi-headless-install-462ccabd75d0)
- [Set up Chromium kiosk mode on Raspbian Lite](https://tamarisk.it/raspberry-pi-kiosk-mode-using-raspbian-lite/)
- [Installing nvm on Raspberry Pi](https://github.com/creationix/nvm)
