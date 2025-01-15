import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import Voice from '@react-native-voice/voice';

const jarvisTTS = require('../scripts/jarvis_tts_bridge');

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [jarvisResponse, setJarvisResponse] = useState('');
  const [sound, setSound] = useState();
  const animation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initialize Jarvis voice
    initializeJarvis();

    // Initialize voice recognition
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const initializeJarvis = async () => {
    try {
      await jarvisTTS.initialize();
    } catch (error) {
      console.error('Failed to initialize Jarvis:', error);
    }
  };

  const playJarvisResponse = async (text) => {
    try {
      // Generate speech using our custom Jarvis voice
      const audioPath = await jarvisTTS.generateSpeech(text);
      
      // Load and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: FileSystem.documentDirectory + audioPath }
      );
      
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Failed to play Jarvis response:', error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        
        if (grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Permissions granted');
        } else {
          console.log('Permissions denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const onSpeechStart = () => {
    console.log('Speech started');
    setIsListening(true);
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsListening(false);
  };

  const onSpeechResults = async (event) => {
    if (event.value && event.value[0]) {
      const text = event.value[0];
      setSpokenText(text);
      await processCommand(text);
    }
  };

  const onSpeechError = (error) => {
    console.log('Speech error:', error);
    setIsListening(false);
    stopAnimation();
  };

  const processCommand = async (text) => {
    const lowerText = text.toLowerCase();
    let response = '';

    // Time commands
    if (lowerText.includes('time')) {
      const now = new Date();
      response = `The current time is ${now.toLocaleTimeString()}`;
    }
    // Greeting commands
    else if (lowerText.includes('hello') || lowerText.includes('hi')) {
      response = 'Hello sir. I am JARVIS, Just A Rather Very Intelligent System. How may I assist you today?';
    }
    // Identity commands
    else if (lowerText.includes('who are you') || lowerText.includes('your name')) {
      response = 'I am JARVIS, an advanced AI system created to assist you with various tasks. I am at your service.';
    }
    // Status commands
    else if (lowerText.includes('status') || lowerText.includes('system')) {
      response = 'All systems are operational. Running diagnostics... No issues detected.';
    }
    // Help commands
    else if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      response = 'I can assist you with various tasks. I can tell you the time, provide system status, and engage in conversation. My capabilities are continuously expanding.';
    }
    // Goodbye commands
    else if (lowerText.includes('goodbye') || lowerText.includes('bye')) {
      response = 'Goodbye sir. I will be here when you need me.';
    }
    // Default response
    else {
      response = `I heard your command "${text}". I am analyzing how to best assist you with that request.`;
    }

    setJarvisResponse(response);
    await playJarvisResponse(response);
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      startAnimation();
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      stopAnimation();
    } catch (e) {
      console.error(e);
    }
  };

  const startAnimation = () => {
    setIsListening(true);
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };

  const stopAnimation = () => {
    setIsListening(false);
    animation.setValue(0);
  };

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000', '#001', '#002']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.circleContainer}>
        <Animated.View
          style={[
            styles.circle,
            {
              transform: [{ rotate }, { scale: animation }],
              opacity: animation,
            },
          ]}
        />
        
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.innerCircle,
              {
                width: 200 - i * 40,
                height: 200 - i * 40,
                opacity: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.7],
                }),
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.statusText}>
        {isListening ? 'Listening...' : 'Tap to activate Jarvis'}
      </Text>

      {spokenText ? (
        <Text style={styles.spokenText}>You: {spokenText}</Text>
      ) : null}

      {jarvisResponse ? (
        <Text style={styles.responseText}>Jarvis: {jarvisResponse}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.button,
          isListening && styles.buttonListening
        ]}
        onPress={isListening ? stopListening : startListening}
      >
        <Text style={styles.buttonText}>
          {isListening ? 'Stop' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  circleContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: '#1976d2',
    position: 'absolute',
  },
  innerCircle: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#2196f3',
    position: 'absolute',
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 30,
    fontWeight: '500',
  },
  spokenText: {
    color: '#90caf9',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  responseText: {
    color: '#4fc3f7',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonListening: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
