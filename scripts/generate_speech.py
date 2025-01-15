import argparse
import torch
import torchaudio
from bark.generation import SAMPLE_RATE
from bark.api import generate_audio

def generate_speech(text, model_path):
    # Generate speech using the trained model
    audio_array = generate_audio(
        text,
        history_prompt=model_path,
        text_temp=0.7,
        waveform_temp=0.7
    )
    
    # Save to a temporary file
    output_path = 'temp_speech.wav'
    torchaudio.save(
        output_path,
        torch.tensor(audio_array).unsqueeze(0),
        SAMPLE_RATE
    )
    
    return output_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--text', required=True, help='Text to convert to speech')
    parser.add_argument('--model', required=True, help='Path to the voice model')
    
    args = parser.parse_args()
    
    output_path = generate_speech(args.text, args.model)
    print(output_path)
