import os
import torch
import torchaudio
import numpy as np
from bark.generation import SAMPLE_RATE, preload_models
from bark.api import generate_audio

# Install required packages if not already installed
os.system('pip install git+https://github.com/suno-ai/bark.git')
os.system('git clone https://github.com/gitmylo/bark-voice-cloning-HuBERT-quantizer')
os.system('pip install -r ./bark-voice-cloning-HuBERT-quantizer/requirements.txt')

# Set device
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Using device: {device}")

def convert_audio(wav, sr, target_sr, target_channels):
    # Convert sample rate
    if sr != target_sr:
        wav = torchaudio.transforms.Resample(sr, target_sr)(wav)
    
    # Convert channels
    if wav.shape[0] != target_channels:
        wav = torch.mean(wav, dim=0, keepdim=True)
    
    return wav

def train_jarvis_voice(audio_filepath):
    # Load HuBERT models
    from bark_hubert_quantizer.pre_kmeans_hubert import CustomHubert
    from bark_hubert_quantizer.customtokenizer import CustomTokenizer
    
    print("Loading HuBERT model...")
    hubert_model = CustomHubert(checkpoint_path='data/models/hubert/hubert.pt').to(device)
    
    print("Loading tokenizer...")
    tokenizer = CustomTokenizer.load_from_checkpoint('data/models/hubert/tokenizer.pth', 
                                                   map_location=device).to(device)
    
    # Load and preprocess audio
    print(f"Loading audio from: {audio_filepath}")
    wav, sr = torchaudio.load(audio_filepath)
    wav = convert_audio(wav, sr, SAMPLE_RATE, 1)
    wav = wav.to(device)
    
    print("Extracting semantic tokens...")
    semantic_vectors = hubert_model.forward(wav, input_sample_hz=SAMPLE_RATE)
    semantic_tokens = tokenizer.get_token(semantic_vectors)
    
    print("Extracting discrete codes...")
    with torch.no_grad():
        encoded_frames = model.encode(wav.unsqueeze(0))
    codes = torch.cat([encoded[0] for encoded in encoded_frames], dim=-1).squeeze()
    
    # Save the voice model
    codes = codes.cpu().numpy()
    semantic_tokens = semantic_tokens.cpu().numpy()
    
    voice_filename = 'jarvis_voice.npz'
    current_path = os.getcwd()
    voice_name = os.path.join(current_path, voice_filename)
    
    print(f"Saving voice model to: {voice_name}")
    np.savez(voice_name, 
             fine_prompt=codes, 
             coarse_prompt=codes[:2, :], 
             semantic_prompt=semantic_tokens)
    
    return voice_name

def generate_jarvis_speech(text, voice_model_path):
    print("Generating speech...")
    audio_array = generate_audio(
        text,
        history_prompt=voice_model_path,
        text_temp=0.7,
        waveform_temp=0.7
    )
    
    return audio_array

def main():
    # Path to your Jarvis training audio
    audio_filepath = '../resources/jarvis_training.wav'
    
    # Train the voice model
    voice_model_path = train_jarvis_voice(audio_filepath)
    
    # Test the model
    test_text = "Hello sir. I am JARVIS, your personal AI assistant. How may I help you today?"
    audio_array = generate_jarvis_speech(test_text, voice_model_path)
    
    # Save the test audio
    output_path = '../resources/jarvis_output.wav'
    torchaudio.save(output_path, 
                   torch.tensor(audio_array).unsqueeze(0), 
                   SAMPLE_RATE)
    
    print(f"Test audio saved to: {output_path}")

if __name__ == "__main__":
    main()
