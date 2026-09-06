import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  MaterialIcons,
  Ionicons,
  Feather,
} from '@expo/vector-icons';

export interface CaptureScreenProps {
  navigation?: any;
}

export const CaptureScreenReactNative: React.FC<CaptureScreenProps> = ({ navigation }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const [gridActive, setGridActive] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isReviewLoading, setIsReviewLoading] = useState<boolean>(false);
  const [recordingStatus, setRecordingStatus] = useState<string>('Hold to describe your craft');
  const [waveformHeights, setWaveformHeights] = useState<number[]>([
    8, 12, 18, 26, 34, 22, 30, 36, 24, 16, 10, 6,
  ]);

  // Bilingual strings matching capture.html
  const strings = {
    en: {
      title: 'AI Studio Editor',
      savedOffline: 'Saved Offline',
      langBtn: 'A / अ',
      liveView: 'Live View',
      detectedBadge: 'Handwoven Saree Detected',
      matchRate: '98% Match',
      frameInstruction: 'Keep heirloom edges within frame',
      lighting: 'Optimal Lighting',
      aiActive: 'AI Studio Active',
      holdToDescribe: 'Hold to describe your craft',
      listening: 'Listening... Speaking your craft',
      processing: '✨ Processing artisan story...',
      captured: 'Voice story captured!',
      promptExample: '“Handwoven blue silk saree, pure zari border, took 4 days to weave”',
      tagHeritage: 'Mention Heritage',
      tagMaterial: 'Material Care',
      tagDays: 'Days Crafted',
      reviewDraft: 'Review AI Draft',
      structuringData: '✨ Structuring Catalog Data...',
      reviewSub: 'Zero typing needed • AI crafts your listing',
    },
    hi: {
      title: 'AI स्टूडियो एडिटर',
      savedOffline: 'ऑफ़लाइन सुरक्षित',
      langBtn: 'अ / A',
      liveView: 'लाइव दृश्य',
      detectedBadge: 'हथकरघा साड़ी पहचानी गई',
      matchRate: '98% मेल',
      frameInstruction: 'साड़ी के किनारों को फ्रेम में रखें',
      lighting: 'अनुकूल प्रकाश',
      aiActive: 'AI स्टूडियो सक्रिय',
      holdToDescribe: 'शिल्प का विवरण देने के लिए दबाकर रखें',
      listening: 'सुन रहा हूँ... अपनी भाषा में बोलें',
      processing: '✨ शिल्प विवरण प्रोसेस हो रहा है...',
      captured: 'विवरण रिकॉर्ड हो गया!',
      promptExample: '“हाथ से बुनी नीली रेशमी साड़ी, शुद्ध ज़री बॉर्डर, बुनने में 4 दिन लगे”',
      tagHeritage: 'विरासत का उल्लेख',
      tagMaterial: 'सामग्री की देखभाल',
      tagDays: 'बनाने में लगे दिन',
      reviewDraft: 'AI ड्राफ्ट की समीक्षा करें',
      structuringData: '✨ कैटलॉग विवरण तैयार हो रहा है...',
      reviewSub: 'टाइपिंग की ज़रूरत नहीं • AI आपकी लिस्टिंग बनाएगा',
    },
  };

  const t = strings[lang];

  // Language toggle handler
  const toggleLanguage = () => {
    if (lang === 'en') {
      setLang('hi');
      Alert.alert('भाषा बदली गई', 'भाषा बदलकर हिंदी कर दी गई है (Hindi)');
    } else {
      setLang('en');
      Alert.alert('Language Switch', 'Language switched to English');
    }
  };

  // Waveform animation simulation while recording
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setWaveformHeights(
          Array.from({ length: 12 }, () => Math.floor(Math.random() * 28) + 8)
        );
      }, 150);
    } else {
      setWaveformHeights([8, 12, 18, 26, 34, 22, 30, 36, 24, 16, 10, 6]);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Audio Recording Handlers
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingStatus(t.listening);
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);
    setRecordingStatus(t.processing);

    setTimeout(() => {
      setIsProcessing(false);
      setRecordingStatus(t.captured);
      setTimeout(() => {
        setRecordingStatus(t.holdToDescribe);
      }, 2000);
    }, 1000);
  };

  // Review Draft Simulation
  const handleReviewDraft = () => {
    setIsReviewLoading(true);
    setTimeout(() => {
      setIsReviewLoading(false);
      if (navigation?.navigate) {
        navigation.navigate('Review');
      } else {
        Alert.alert(
          lang === 'en' ? 'AI Draft Ready' : 'AI ड्राफ्ट तैयार है',
          lang === 'en'
            ? 'Blue Silk Saree catalog listing generated with high-confidence tags & pricing recommendation (₹1,200).'
            : 'नीली रेशमी साड़ी की लिस्टिंग विवरण व मूल्य (₹1,200) सफलतापूर्वक तैयार कर लिया गया है।'
        );
      }
    }, 1200);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fbf9f5]">
      <StatusBar barStyle="dark-content" />

      {/* TOP FIXED HEADER (pt-safe, 48px+ touch targets) */}
      <View className="h-16 px-4 flex-row items-center justify-between bg-[#fbf9f5]/95 border-b border-[#eae8e4] z-50">
        <View className="flex-row items-center space-x-2">
          {/* Back Button (48x48px tap target) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('MainTabs');
              } else {
                Alert.alert('Navigation', 'Going back to Catalog...');
              }
            }}
            className="w-12 h-12 items-center justify-center rounded-full active:scale-95 -ml-2"
          >
            <Feather name="arrow-left" size={22} color="#140c09" />
          </TouchableOpacity>

          <View className="flex-col">
            <Text className="text-[18px] font-semibold text-[#140c09] tracking-tight">
              {t.title}
            </Text>
            <View className="flex-row items-center space-x-1">
              <MaterialIcons name="cloud-done" size={13} color="#047857" />
              <Text className="text-[11px] font-medium text-[#047857]">
                {t.savedOffline}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center space-x-2">
          {/* Language Switcher Pill (48px tap height) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleLanguage}
            className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-[#F3EFEA] border border-[#E8E2D9]/40 flex-row items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <MaterialIcons name="translate" size={16} color="#B39366" />
            <Text className="text-[13px] font-semibold text-[#140c09]">
              {t.langBtn}
            </Text>
          </TouchableOpacity>

          {/* Profile Avatar */}
          <View className="w-8 h-8 rounded-full bg-[#140c09] items-center justify-center shadow-xs">
            <Feather name="user" size={16} color="#ffffff" />
          </View>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 bg-[#fbf9f5]"
      >
        {/* VIEWFINDER STAGE (Approx 60% visual weight) */}
        <View className="relative w-full aspect-[4/5] bg-[#191312] overflow-hidden justify-between p-4 shadow-xl">
          {/* Camera Sensor Stream Simulation */}
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV3-xCzN9TdTuHufN2Eugbk_EZBDJA_VggGkHJFBe14GOnP9jvtR6Ee9vNq-Aw1XP7TDBVxytmQRP9igWfX9KFvxyeutdk5zYrrX_dgvibmIohF6cCEOqXwbxZiarLCs_p9eDtD_QU3cljge8SkKKNWcep6mY5_T-xCnBJj2niY32GH3Pk3XlykQMu8lqIg701PTDGB7sn-cna7dpzkjeV1gVX7Ke_l5Q6i0XTqcNXl1n8Gjv10NB9',
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />

          {/* Optical Vignette Overlay */}
          <View className="absolute inset-0 bg-black/35" />

          {/* Top Floating Viewfinder Controls (Flash & Grid) */}
          <View className="relative z-10 flex-row items-center justify-between w-full pt-1">
            <View className="flex-row items-center space-x-2 bg-[#191312]/60 px-3 py-1.5 rounded-full backdrop-blur-md">
              <View className="w-2 h-2 rounded-full bg-[#B39366]" />
              <Text className="text-[11px] text-[#FDFCFA] tracking-widest uppercase font-semibold">
                {t.liveView}
              </Text>
            </View>

            <View className="flex-row items-center space-x-2">
              {/* Flash Button (48x48px tap target) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFlashActive(!flashActive)}
                className={`w-12 h-12 rounded-full items-center justify-center backdrop-blur-md active:scale-95 ${
                  flashActive ? 'bg-[#191312] text-[#B39366]' : 'bg-[#191312]/50 text-white'
                }`}
              >
                <Ionicons
                  name={flashActive ? 'flash' : 'flash-off'}
                  size={20}
                  color={flashActive ? '#B39366' : '#FDFCFA'}
                />
              </TouchableOpacity>

              {/* Grid Button (48x48px tap target) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setGridActive(!gridActive)}
                className={`w-12 h-12 rounded-full items-center justify-center backdrop-blur-md active:scale-95 ${
                  gridActive ? 'bg-[#191312]' : 'bg-[#191312]/50'
                }`}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={gridActive ? '#B39366' : '#FDFCFA'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Framing Guides & AI Recognition Zone */}
          <View className="relative z-10 my-auto w-full px-2 items-center">
            {/* 3x3 Alignment Grid */}
            {gridActive && (
              <View className="absolute inset-0 flex-col justify-between pointer-events-none opacity-40">
                <View className="flex-1 flex-row border-b border-white/30">
                  <View className="flex-1 border-r border-white/30" />
                  <View className="flex-1 border-r border-white/30" />
                  <View className="flex-1" />
                </View>
                <View className="flex-1 flex-row border-b border-white/30">
                  <View className="flex-1 border-r border-white/30" />
                  <View className="flex-1 border-r border-white/30" />
                  <View className="flex-1" />
                </View>
                <View className="flex-1 flex-row">
                  <View className="flex-1 border-r border-white/30" />
                  <View className="flex-1 border-r border-white/30" />
                  <View className="flex-1" />
                </View>
              </View>
            )}

            {/* Bounding Frame Container */}
            <View className="relative w-full aspect-[4/3] rounded-2xl items-center justify-center p-2 border-2 border-dashed border-white/40">
              {/* Dynamic AI Classification Badge */}
              <View className="absolute -top-3 left-4 flex-row items-center space-x-1.5 bg-[#191312]/90 px-3 py-1 rounded-full shadow-md">
                <MaterialIcons name="auto-awesome" size={16} color="#B39366" />
                <Text className="text-[11px] font-semibold tracking-wider text-[#FDFCFA]">
                  {t.detectedBadge}
                </Text>
                <View className="w-1.5 h-1.5 rounded-full bg-[#B39366]" />
                <Text className="text-[10px] text-[#B39366] font-semibold">
                  {t.matchRate}
                </Text>
              </View>

              {/* Center Framing Cue */}
              <View className="flex-col items-center space-y-2 bg-[#191312]/50 px-4 py-2 rounded-xl text-center">
                <MaterialIcons name="center-focus-weak" size={26} color="#FDFCFA" />
                <Text className="text-[13px] text-[#FDFCFA]/90 tracking-wide text-center">
                  {t.frameInstruction}
                </Text>
              </View>

              {/* Lighting Health Pill */}
              <View className="absolute -bottom-3 right-4 flex-row items-center space-x-1.5 bg-[#F3EFEA]/95 px-3 py-1 rounded-full shadow-sm">
                <MaterialIcons name="wb-sunny" size={14} color="#725b38" />
                <Text className="text-[11px] font-semibold text-[#140c09] tracking-tight">
                  {t.lighting}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* BOTTOM VOICE SYNTHESIS & AUDIO CONTROL PANEL (Approx 40%) */}
        <View className="relative -mt-4 z-20 w-full rounded-t-3xl bg-[#191312] text-[#FDFCFA] px-4 pt-5 pb-8 shadow-2xl flex-col items-center">
          {/* Grabber Notch Decorator */}
          <View className="w-10 h-1 rounded-full bg-[#968783]/40 mb-3" />

          {/* AI Studio State Badge */}
          <View className="flex-row items-center space-x-2 bg-[#2b211e]/80 px-3.5 py-1.5 rounded-full shadow-sm mb-3">
            <View className="w-2 h-2 rounded-full bg-[#B39366]" />
            <Text className="text-[11px] text-[#FDFCFA] tracking-wide uppercase font-semibold">
              {t.aiActive}
            </Text>
          </View>

          {/* Dynamic Audio Waveform Visualizer */}
          <View className="w-full h-10 px-2 flex-row items-center justify-center space-x-1.5 my-1">
            {waveformHeights.map((h, index) => (
              <View
                key={index}
                style={{ height: h }}
                className={`w-1 rounded-full ${
                  isRecording ? 'bg-white' : 'bg-[#B39366]/60'
                }`}
              />
            ))}
          </View>

          {/* Giant Glowing Microphone Core */}
          <View className="relative my-4 items-center justify-center">
            {/* Radiating Ambient Rings */}
            <View className="absolute w-32 h-32 rounded-full bg-[#B39366]/15 pointer-events-none" />
            <View className="absolute w-28 h-28 rounded-full bg-[#B39366]/25 pointer-events-none" />

            {/* Tactile Microphone Button (80x80px, well above 48px tap target) */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isProcessing}
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
              className={`w-20 h-20 rounded-full items-center justify-center shadow-2xl active:scale-95 ${
                isRecording
                  ? 'bg-[#B39366]'
                  : isProcessing
                  ? 'bg-[#2b211e] border-2 border-[#B39366]'
                  : 'bg-[#2b211e] border-2 border-[#B39366]/60'
              }`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#B39366" />
              ) : (
                <Feather
                  name="mic"
                  size={34}
                  color={isRecording ? '#191312' : '#FDFCFA'}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Humanized Guidance & Live Speech Prompt */}
          <View className="w-full max-w-sm items-center px-2 mt-1">
            <Text
              className={`text-[16px] font-semibold tracking-normal mb-1 text-center ${
                isRecording ? 'text-[#B39366]' : 'text-[#FDFCFA]'
              }`}
            >
              {recordingStatus}
            </Text>
            <Text className="text-[13px] text-[#968783] leading-relaxed text-center">
              {t.promptExample}
            </Text>
          </View>

          {/* Craft Story Insight Tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="w-full mt-4 pt-2"
            contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <View className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#2b211e]">
              <MaterialIcons name="history-edu" size={14} color="#B39366" />
              <Text className="text-[11px] text-[#968783] font-medium">
                {t.tagHeritage}
              </Text>
            </View>

            <View className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#2b211e]">
              <MaterialIcons name="texture" size={14} color="#B39366" />
              <Text className="text-[11px] text-[#968783] font-medium">
                {t.tagMaterial}
              </Text>
            </View>

            <View className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#2b211e]">
              <MaterialIcons name="schedule" size={14} color="#B39366" />
              <Text className="text-[11px] text-[#968783] font-medium">
                {t.tagDays}
              </Text>
            </View>
          </ScrollView>

          {/* Quick Review Trigger Button (56px height, min 48px tap target) */}
          <View className="w-full flex-col space-y-2 mt-5 px-1">
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleReviewDraft}
              className="w-full h-14 rounded-2xl bg-[#B39366] flex-row items-center justify-center space-x-2 shadow-xl active:scale-95"
            >
              {isReviewLoading ? (
                <>
                  <ActivityIndicator size="small" color="#191312" />
                  <Text className="text-[#191312] font-bold text-[16px]">
                    {t.structuringData}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-[#191312] font-bold text-[16px] tracking-wide">
                    {t.reviewDraft}
                  </Text>
                  <Feather name="arrow-right" size={20} color="#191312" />
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center justify-center space-x-1.5 pt-1">
              <MaterialIcons name="graphic-eq" size={15} color="#B39366" />
              <Text className="text-[#968783] text-[12px] font-medium">
                {t.reviewSub}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CaptureScreenReactNative;
