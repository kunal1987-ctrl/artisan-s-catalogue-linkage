import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  MaterialIcons,
  Ionicons,
  Feather,
} from '@expo/vector-icons';

export interface AuthScreenProps {
  navigation?: any;
}

export const AuthScreenReactNative: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isOtpLoading, setIsOtpLoading] = useState<boolean>(false);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Toggle Language Handler
  const toggleLanguage = () => {
    if (lang === 'en') {
      setLang('hi');
      Alert.alert('भाषा बदली (Language Switch)', 'भाषा बदलकर हिंदी कर दी गई है (Hindi)');
    } else {
      setLang('en');
      Alert.alert('Language Switch', 'Language switched to English');
    }
  };

  // Voice Input Simulation
  const handleVoiceInput = () => {
    setIsListening(true);
    Alert.alert(
      lang === 'en' ? 'Voice Input' : 'बोलकर नंबर दर्ज करें',
      lang === 'en'
        ? 'Listening for 10-digit mobile number...'
        : 'अपना 10-अंकों का मोबाइल नंबर बोलें...'
    );
    setTimeout(() => {
      setIsListening(false);
      setPhoneNumber('9876543210');
    }, 2000);
  };

  // Handle OTP Submission
  const handleSendOtp = () => {
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanedNumber.length < 10) {
      Alert.alert(
        lang === 'en' ? 'Invalid Number' : 'अमान्य मोबाइल नंबर',
        lang === 'en'
          ? 'Please enter a valid 10-digit mobile number.'
          : 'कृपया 10-अंकों का वैध मोबाइल नंबर दर्ज करें।'
      );
      return;
    }

    setIsOtpLoading(true);
    setTimeout(() => {
      setIsOtpLoading(false);
      setIsOtpSent(true);
      if (navigation?.replace) {
        navigation.replace('MainTabs');
      } else if (navigation?.navigate) {
        navigation.navigate('MainTabs');
      }
    }, 1000);
  };

  // Social Logins
  const handleGoogleLogin = () => {
    if (navigation?.replace) {
      navigation.replace('MainTabs');
    } else if (navigation?.navigate) {
      navigation.navigate('MainTabs');
    } else {
      Alert.alert('Google Sign-In', 'Opening Google Authentication...');
    }
  };

  const handleWhatsAppLogin = () => {
    if (navigation?.replace) {
      navigation.replace('MainTabs');
    } else if (navigation?.navigate) {
      navigation.navigate('MainTabs');
    } else {
      Alert.alert(
        'WhatsApp Login',
        lang === 'en'
          ? 'Logging in securely with WhatsApp...'
          : 'व्हाट्सएप से सुरक्षित लॉगिन किया जा रहा है...'
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fbf9f5]">
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1 bg-[#fbf9f5]"
      >
        {/* TOP SECTION / HERO SHOWCASE */}
        <View className="relative px-4 pt-2">
          <View className="relative overflow-hidden rounded-2xl shadow-sm bg-[#efeeea]">
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbuH_MdJzcKPoXTkvHKlbZwFRTpj29jGcIv-n89BxkVMnXaYJNgfin-eHntOjP061Ih61VS52Xq1S7m9AeMQ-KNhzUT21BcQlpzPg4VmSBtNGw6WdZLzqSdyC7Ofa5dC5XVZ5Jx08qNabLkg4nFfjbYBYelKMI4q2YtJ-rVNWOnJclKum-nJ-Z_0oGBUXy_i3QCHKtnkJsmG3f-BTVorjDUwgPV2ThCND4oEmrirXvVE0d9Mw2-Nto',
              }}
              className="w-full aspect-[4/3] object-cover"
            />
            {/* Scrim Overlay */}
            <View className="absolute inset-0 bg-black/25" />

            {/* Subtle Floating Badge Overlaid on Hero (Top Left) */}
            <View className="absolute top-3 left-3 bg-white/90 px-3 py-1.5 rounded-full shadow-sm flex-row items-center space-x-1.5">
              <View className="w-1.5 h-1.5 rounded-full bg-[#725b38]" />
              <Text className="text-[10px] text-[#725b38] font-bold tracking-widest uppercase">
                हस्तशिल्प मंच • DIGITAL ATELIER
              </Text>
            </View>

            {/* Language Toggle Button in Hero Top Right (48px tap target) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleLanguage}
              className="absolute top-3 right-3 min-h-[44px] bg-white/95 border border-[#fedeb2]/50 shadow-sm px-3.5 py-1.5 rounded-full flex-row items-center space-x-1.5 active:scale-95"
            >
              <MaterialIcons name="translate" size={16} color="#725b38" />
              <Text className="font-bold text-[13px] tracking-wide text-[#140c09]">
                {lang === 'en' ? 'A / अ' : 'अ / A'}
              </Text>
            </TouchableOpacity>

            {/* Quick Trust Ribbon on Image Base */}
            <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-between">
              <Text className="text-[11px] tracking-wider text-white font-medium opacity-90">
                Bespoke Artisan Guild
              </Text>
              <View className="bg-[#fedeb2] px-2.5 py-0.5 rounded-full">
                <Text className="text-[10px] tracking-wider text-[#281800] font-bold">
                  Zero Commission
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* GREETING & VALUE PROPOSITION */}
        <View className="px-5 pt-5 pb-2 text-left">
          <View className="flex-row items-center space-x-2 mb-1">
            <Text className="text-[28px] font-bold text-[#191312] tracking-tight">
              Namaste! 🙏
            </Text>
          </View>
          <View className="space-y-0.5">
            <Text className="text-[20px] font-semibold text-[#2b211e] leading-snug">
              Take your craft to the digital world.
            </Text>
            <Text className="text-[15px] text-[#725b38] font-medium tracking-wide">
              अपनी कला को पूरे देश तक पहुँचाएं
            </Text>
          </View>

          {/* Supportive Benefit Callout */}
          <View className="mt-3.5 p-3 rounded-2xl bg-[#F5ECE7] flex-row items-start space-x-2.5">
            <MaterialIcons
              name="verified"
              size={18}
              color="#725b38"
              style={{ marginTop: 2 }}
            />
            <Text className="text-[13px] text-[#4e4542] leading-relaxed flex-1">
              Direct connection to discerning patrons across India.{' '}
              <Text className="font-bold text-[#191312]">Zero commission</Text> on your first 10
              orders.
            </Text>
          </View>
        </View>

        {/* MOBILE PHONE INPUT & AUTHENTICATION CARD */}
        <View className="px-4 mt-3">
          <View className="bg-white p-5 rounded-2xl shadow-sm">
            <View className="flex-col space-y-3.5">
              {/* Field Header */}
              <View className="flex-row items-center justify-between">
                <Text className="text-[11px] text-[#807571] uppercase tracking-wider font-semibold">
                  Mobile Number • मोबाइल नंबर
                </Text>
                <Text className="text-[11px] text-[#B39366] font-bold">
                  OTP Verification
                </Text>
              </View>

              {/* Phone Input Cluster */}
              <View className="flex-row items-center space-x-2.5">
                {/* Country Code Pill */}
                <View className="flex-row items-center space-x-1.5 px-3.5 py-3.5 bg-[#f5f3ef] rounded-full shrink-0 shadow-sm">
                  <Text className="text-base leading-none">🇮🇳</Text>
                  <Text className="text-[16px] text-[#140c09] font-semibold tracking-normal">
                    +91
                  </Text>
                  <MaterialIcons name="arrow-drop-down" size={18} color="#807571" />
                </View>

                {/* Input Box with Voice Mic & Phone Cue */}
                <View className="relative flex-1 flex-row items-center">
                  <TextInput
                    value={phoneNumber}
                    onChangeText={(text) => {
                      const digits = text.replace(/[^0-9]/g, '');
                      setPhoneNumber(digits);
                    }}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder={
                      isListening ? 'Listening... (बोलिए...)' : 'Enter Mobile Number'
                    }
                    placeholderTextColor="#807571"
                    className="w-full bg-[#f5f3ef] pl-4 pr-16 py-3.5 rounded-full text-[17px] text-[#140c09] shadow-sm"
                  />

                  {/* Voice input mic and phone cue button cluster */}
                  <View className="absolute right-2 flex-row items-center space-x-1">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleVoiceInput}
                      className="w-8 h-8 rounded-full items-center justify-center active:scale-95"
                    >
                      <Feather
                        name="mic"
                        size={18}
                        color={isListening ? '#ba1a1a' : '#725b38'}
                      />
                    </TouchableOpacity>
                    <Feather
                      name="phone"
                      size={16}
                      color="#807571"
                      style={{ opacity: 0.5, marginRight: 6 }}
                    />
                  </View>
                </View>
              </View>

              <Text className="text-[13px] text-[#807571] px-1">
                बटन दबाकर अपना 10-अंकों का मोबाइल नंबर दर्ज करें
              </Text>

              {/* Primary Action Button (48px+ tap target) */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSendOtp}
                className={`w-full mt-1 py-4 px-6 rounded-full flex-row items-center justify-center space-x-2 shadow-md active:scale-[0.98] ${
                  isOtpSent
                    ? 'bg-[#725b38]'
                    : phoneNumber.length === 10
                    ? 'bg-[#140c09] border-2 border-[#B39366]'
                    : 'bg-[#140c09]'
                }`}
              >
                {isOtpLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="font-semibold tracking-widest uppercase text-sm text-white">
                      SENDING OTP...
                    </Text>
                  </>
                ) : isOtpSent ? (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text className="font-semibold tracking-widest uppercase text-sm text-white">
                      OTP SENT!
                    </Text>
                    <Text className="font-normal text-xs text-[#F5ECE7] opacity-90">
                      (ओटीपी भेजा गया)
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="font-semibold tracking-widest uppercase text-sm text-white">
                      SEND OTP
                    </Text>
                    <Text className="font-normal text-xs text-[#F5ECE7] opacity-90">
                      (ओटीपी प्राप्त करें)
                    </Text>
                    <Feather name="arrow-right" size={16} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              {/* Centered Voice/SMS Reassurance Helper Text */}
              <View className="flex-row items-center justify-center space-x-1.5 pt-0.5">
                <Text className="text-sm">🔊</Text>
                <Text className="text-[12px] text-[#4e4542] font-medium text-center">
                  हम आपको एसएमएस के माध्यम से ऑटो-ओटीपी भेजेंगे{' '}
                  <Text className="opacity-75 text-[11px] font-normal">
                    (We will auto-read OTP via SMS)
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* DIVIDER */}
        <View className="px-8 my-5 flex-row items-center space-x-3">
          <View className="flex-1 h-[1px] bg-[#d2c3c0]/50" />
          <Text className="text-[11px] text-[#807571] uppercase tracking-widest font-semibold px-1">
            OR • या
          </Text>
          <View className="flex-1 h-[1px] bg-[#d2c3c0]/50" />
        </View>

        {/* ALTERNATIVE SOCIAL & QUICK ACTIONS */}
        <View className="px-4 flex-col space-y-2.5">
          {/* Google Login Pill (min 52px height) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogleLogin}
            className="w-full min-h-[52px] bg-white py-3.5 px-5 rounded-full shadow-sm flex-row items-center justify-center space-x-3 active:scale-[0.99]"
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text className="text-[16px] font-medium text-[#191312]">
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* WhatsApp Quick Access (min 50px height) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWhatsAppLogin}
            className="w-full min-h-[50px] bg-[#efeeea] py-3 px-5 rounded-full flex-row items-center justify-center space-x-2.5 active:scale-[0.99]"
          >
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text className="text-[15px] text-[#140c09] font-medium">
              Login with WhatsApp
            </Text>
            <Text className="text-[13px] text-[#725b38]">
              (व्हाट्सएप लॉगिन)
            </Text>
          </TouchableOpacity>
        </View>

        {/* LEGAL & TRUST FOOTER */}
        <View className="px-6 mt-6 items-center space-y-2 text-center">
          <Text className="text-[13px] text-[#807571] leading-relaxed text-center max-w-xs">
            By logging in, you agree to our{' '}
            <Text
              onPress={() => Alert.alert('Terms', 'Artisan Guild Terms & Conditions')}
              className="underline text-[#140c09]"
            >
              Terms & Conditions
            </Text>{' '}
            and{' '}
            <Text
              onPress={() => Alert.alert('Privacy', 'Artisan Privacy Policy')}
              className="underline text-[#140c09]"
            >
              Privacy Policy
            </Text>
            .
          </Text>
          <Text className="text-[12px] text-[#807571]/80 text-center">
            लॉगिन करके आप नियमों व शर्तों से सहमत होते हैं
          </Text>

          {/* Micro Trust Badges Strip */}
          <View className="pt-2 flex-row items-center justify-center">
            <View className="flex-row items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#eae8e4]/60">
              <MaterialIcons name="verified-user" size={16} color="#725b38" />
              <Text className="text-[11px] text-[#4e4542] font-medium tracking-wide">
                100% Free & Secure • Govt. Recognized Handloom Guild
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AuthScreenReactNative;
