# ikanreed/pyweek26: WaveStopper
Built on python 3.6-64bit on windows(but linux/osx should be fine)

Depends on support for GLSL(opengl) 4.0. That's 8 years old, and every recent computer/driver should support it, but you know, if you're having problems, check that

See requirements.txt for python module needs


How to run
----------
1. pip install requirements.txt 
2. from the folder containing this readme and main.py run main.py *path-to-image*  
3. The image file should be filled with black(0x000000) background, white(0xFFFFFF) permenant surfaces, and blue(0x0000FF) water, the water will then flow around.  A couple examples can be found in content/images
4. No actual game will happen, because I ran out of time making the simulation.  Sorry.
