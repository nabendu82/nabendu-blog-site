"""Generate the original, seamless DEAD//SHIFT music stems (no samples)."""
import math
import os
import struct
import subprocess
import tempfile
import wave

ROOT=os.path.dirname(os.path.dirname(__file__))
OUT=os.path.join(ROOT,'public','audio','music')
os.makedirs(OUT,exist_ok=True)
RATE=24000
SECONDS=32
COUNT=RATE*SECONDS
TAU=math.tau
ROOTS=[55.0,43.6535,73.4162,41.2034]
FIFTHS=[82.4069,65.4064,110.0,61.7354]
ARP=[[220,261.63,329.63,392],[174.61,220,261.63,329.63],[146.83,220,293.66,349.23],[164.81,246.94,329.63,392]]

def hash_noise(index):
    n=(index*1664525+1013904223)&0xffffffff
    n^=n>>16
    return (n&65535)/32768-1

def tone(freq,t):
    phase=TAU*freq*t
    return math.sin(phase)+.23*math.sin(phase*2.003)+.08*math.sin(phase*3.01)

def sample(t,index,combat):
    chord=min(3,int(t//8))
    root=ROOTS[chord]
    swell=.67+.20*math.sin(TAU*t/16-.4)
    drone=(.29*tone(root,t)+.12*tone(FIFTHS[chord],t)+.10*math.sin(TAU*root*.5*t))*swell
    beat=t*2
    pulse_age=(beat%1)/2
    pulse=.16*math.sin(TAU*root*2*t)*math.exp(-7*pulse_age)
    step=int(t*4)%4
    note=ARP[chord][(int(t*4)//2)%4]
    arp_age=(t*2)%1/2
    arp=.065*tone(note,t)*math.exp(-5*arp_age)
    kick_age=(beat%(1 if combat else 2))/2
    kick=(.27 if combat else .13)*math.sin(TAU*(58*kick_age+13*kick_age*kick_age))*math.exp(-22*kick_age)
    back_age=((beat-1)%2)/2
    noise=hash_noise(index)
    prev=hash_noise(index-1)
    snare=(.085 if combat else .018)*(noise-prev)*math.exp(-34*back_age)
    hat_age=(t*4)%1/4
    hat=(.037 if combat else .008)*(noise-prev)*math.exp(-95*hat_age)
    metallic_age=t%4
    metal=(.035 if combat else .022)*math.sin(TAU*131.3*t+1.7*math.sin(TAU*59*t))*math.exp(-5*metallic_age)
    bed=drone+pulse+arp+kick+snare+hat+metal
    # Same bar grid and duration for both stems; fade only 20 ms at the seam.
    seam=min(1,t/.02,(SECONDS-t)/.02)
    left=math.tanh(1.3*(bed+.012*math.sin(TAU*root*1.003*t)))*seam
    right=math.tanh(1.3*(bed-.012*math.sin(TAU*root*.997*t)))*seam
    return int(max(-1,min(1,left)) * 22500),int(max(-1,min(1,right))*22500)

for combat,name in [(False,'dead-shift-calm.mp3'),(True,'dead-shift-combat.mp3')]:
    with tempfile.TemporaryDirectory() as tmp:
        wav_path=os.path.join(tmp,'stem.wav')
        with wave.open(wav_path,'wb') as wav:
            wav.setnchannels(2)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            block=bytearray()
            for index in range(COUNT):
                block+=struct.pack('<hh',*sample(index/RATE,index,combat))
                if len(block)>=32768:
                    wav.writeframes(block)
                    block.clear()
            if block:wav.writeframes(block)
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',wav_path,'-c:a','libmp3lame','-q:a','4',os.path.join(OUT,name)],check=True)
    print(name,os.path.getsize(os.path.join(OUT,name)),'bytes')
