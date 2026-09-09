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
  Switch,
} from 'react-native';
import {
  MaterialIcons,
  Ionicons,
  Feather,
} from '@expo/vector-icons';

export interface ReviewScreenProps {
  navigation?: any;
}

export const ReviewScreenReactNative: React.FC<ReviewScreenProps> = ({ navigation }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [isOndcEnabled, setIsOndcEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const toggleLanguage = () => {
    if (lang === 'en') {
      setLang('hi');
      showToast('भाषा बदली गई (Language preference updated to Hindi)');
    } else {
      setLang('en');
      showToast('Language preference updated to English');
    }
  };

  const handleAudioGuide = () => {
    showToast('ध्वनि संदेश बज रहा है (Playing voice audio guide)...');
    Alert.alert(
      lang === 'en' ? 'Voice Guide' : 'ध्वनि मार्गदर्शिका',
      '🎙️ "व्हाट्सएप पर शेयर करके अपने पहले 5 ग्राहकों तक पहुंचें और सीधा ऑर्डर प्राप्त करें। (Share to WhatsApp to reach your first 5 customers)"'
    );
  };

  const handleShareWhatsApp = () => {
    showToast('लिंक कॉपी हो गया! WhatsApp खुल रहा है...');
    Alert.alert(
      'WhatsApp Share',
      'Opening WhatsApp with product link and verified craft certificate for "Handwoven Blue Pure Silk Saree" (₹1,200).'
    );
  };

  const handleToggleOndc = (value: boolean) => {
    setIsOndcEnabled(value);
    showToast(
      value
        ? 'ONDC नेटवर्क सक्रिय (ONDC Network Enabled)'
        : 'ONDC नेटवर्क निष्क्रिय (ONDC Disabled)'
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fbf9f5]">
      <StatusBar barStyle="dark-content" />

      {/* Ambient background glow decoration */}
      <View className="relative flex-1 bg-[#fbf9f5]">
        {/* TOP HEADER: Back & Language / Sync status */}
        <View className="w-full flex-row items-center justify-between px-4 py-3 z-20">
          {/* Close / Dismiss modal tap target (min 48x48) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('MainTabs');
              } else {
                Alert.alert('Dismiss', 'Returning to Artisan Inventory...');
              }
            }}
            className="w-12 h-12 items-center justify-center rounded-full bg-[#efeeea] active:scale-95 shadow-xs"
          >
            <Ionicons name="close" size={22} color="#140c09" />
          </TouchableOpacity>

          {/* Center Sync Pill Status */}
          <View className="flex-row items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#f5f3ef] shadow-xs">
            <MaterialIcons name="cloud-done" size={16} color="#725b38" />
            <Text className="text-[12px] font-semibold text-[#4e4542]">
              Synced & Live
            </Text>
          </View>

          {/* Bilingual Toggle Tap Target (min 48x48) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleLanguage}
            className="w-12 h-12 items-center justify-center rounded-full bg-[#f5f3ef] active:scale-95 shadow-xs"
          >
            <Text className="text-[12px] font-bold tracking-wide text-[#140c09]">
              {lang === 'en' ? 'A / अ' : 'अ / A'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MAIN SCROLLABLE SUCCESS CANVAS */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 50 }}
          className="flex-1 px-4 pt-1"
        >
          {/* CELEBRATION HEADER & SPARKLES VISUAL */}
          <View className="relative flex-col items-center text-center pt-2 pb-2">
            {/* Celebration Ring with Floating Emojis */}
            <View className="relative items-center justify-center mb-3">
              <View className="w-20 h-20 rounded-full bg-[#fedeb2]/40 items-center justify-center shadow-sm">
                <View className="w-14 h-14 rounded-full bg-[#140c09] items-center justify-center shadow-md">
                  <Ionicons name="checkmark-circle" size={32} color="#ffffff" />
                </View>
              </View>

              {/* Decorative badges */}
              <Text className="absolute -top-1 -right-2 text-2xl">✨</Text>
              <Text className="absolute -bottom-1 -left-3 text-xl">🎉</Text>
              <Text className="absolute top-1/2 -left-6 text-lg">🪡</Text>
            </View>

            {/* Bilingual celebration headlines */}
            <View className="flex-row items-center space-x-1.5 px-3 py-1 rounded-full bg-[#fedeb2] mb-2">
              <MaterialIcons name="auto-awesome" size={15} color="#78603e" />
              <Text className="text-[11px] font-bold text-[#281800]">
                शिल्प सेतु प्रमाणित शिल्पकला • Verified
              </Text>
            </View>

            <Text className="text-[26px] font-bold text-[#140c09] tracking-tight text-center leading-tight">
              {lang === 'en' ? 'Congratulations! Product is Live!' : 'बधाई हो! Product is Live!'}
            </Text>
            <Text className="text-[14px] text-[#4e4542] max-w-[320px] mt-1.5 text-center leading-snug">
              {lang === 'en'
                ? 'Your craft is visible to patrons across India and ready for direct orders.'
                : 'आपकी शिल्पकला पूरे देश के खरीदारों को दिख रही है और सीधे ऑर्डर के लिए तैयार है।'}
            </Text>
          </View>

          {/* AUDIO HELPER / LOW-LITERACY VOICE PILL */}
          <View className="w-full mt-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAudioGuide}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-full bg-[#eae8e4] flex-row items-center justify-between shadow-sm active:scale-[0.99]"
            >
              <View className="flex-row items-center space-x-2.5 flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-[#725b38] items-center justify-center shrink-0">
                  <Feather name="volume-2" size={17} color="#ffffff" />
                </View>
                <Text className="text-[13px] text-[#140c09] flex-1" numberOfLines={1}>
                  <Text className="font-bold text-[#725b38]">सुनिए: </Text>
                  "व्हाट्सएप पर शेयर करके पहले 5 ग्राहकों तक पहुंचाएं"
                </Text>
              </View>
              <Text className="text-[11px] font-semibold text-[#4e4542] shrink-0">
                Tap to hear
              </Text>
            </TouchableOpacity>
          </View>

          {/* PRODUCT SUMMARY CARD */}
          <View className="w-full bg-white rounded-2xl p-4 shadow-sm flex-col space-y-3 mt-4 border border-[#efeeea]">
            <View className="flex-row space-x-3.5 items-center">
              {/* Thumbnail with HD Tag */}
              <View className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-[#efeeea] relative shadow-sm">
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlrPAyvNl_t4YKO8w_w-8U9DRhBPBK1zXyAqaEGSTKfIgX9zbFdVqhUz24eNyhzT-VuM5wuhWPS4TD0e650W0LH_Zpq2DGYrdxnIdJZLQBWy8sa4I0ePgxqBXrAITaOFKziX8se_79awuadNxGCAfRP4s5tsSwv_d8MhZMbiXzK4ft7mKRWbTud1DZzH0Kxt8B1sQRlVgDX7pzayDRDxTV-AbsRb-IF1Ryu3Q6xhv9GW2JC3B8yXoX',
                  }}
                  className="w-full h-full object-cover"
                />
                <View className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#2b211e]/90">
                  <Text className="text-[9px] font-bold text-white">HD</Text>
                </View>
              </View>

              {/* Details */}
              <View className="flex-col flex-1 justify-center">
                <View className="flex-row items-center space-x-1.5 mb-1">
                  <View className="w-2 h-2 rounded-full bg-[#059669]" />
                  <Text className="text-[11px] font-bold text-[#065f46]">
                    In Stock (1 piece ready)
                  </Text>
                </View>
                <Text className="text-[17px] font-bold text-[#140c09] leading-snug" numberOfLines={1}>
                  Handwoven Blue Pure Silk Saree
                </Text>
                <View className="flex-row items-baseline space-x-2 mt-0.5">
                  <Text className="text-[18px] font-extrabold text-[#725b38]">
                    ✨ ₹1,200
                  </Text>
                  <Text className="text-[12px] text-[#4e4542]">
                    Listing #KS-8492
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick stats bar */}
            <View className="flex-row justify-between pt-2 bg-[#f5f3ef] rounded-xl p-2.5 text-center">
              <View className="flex-1 items-center">
                <Text className="text-[11px] text-[#4e4542]">Shipping</Text>
                <Text className="text-[13px] text-[#140c09] font-bold">Free Pan-India</Text>
              </View>
              <View className="flex-1 items-center border-x border-[#d2c3c0]/40">
                <Text className="text-[11px] text-[#4e4542]">Dispatch</Text>
                <Text className="text-[13px] text-[#140c09] font-bold">24-48 Hours</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-[11px] text-[#4e4542]">Commission</Text>
                <Text className="text-[13px] text-[#065f46] font-bold">0% Direct</Text>
              </View>
            </View>
          </View>

          {/* PRIMARY ACTION 1: Giant Tactile WhatsApp Share Button (min 60px) */}
          <View className="flex-col space-y-2 mt-4">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleShareWhatsApp}
              className="w-full min-h-[60px] py-3.5 px-5 rounded-full bg-[#1e7e45] flex-row items-center justify-between shadow-md active:scale-[0.98]"
            >
              <View className="flex-row items-center space-x-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center shrink-0">
                  <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
                </View>
                <View className="flex-col flex-1">
                  <Text className="text-[14px] font-bold text-white tracking-wide leading-tight">
                    Share to WhatsApp • व्हाट्सएप पर शेयर करें
                  </Text>
                  <Text className="text-[12px] text-white/90 leading-tight mt-0.5">
                    Send to customers & family group with 1 tap
                  </Text>
                </View>
              </View>
              <Feather name="arrow-right" size={22} color="#ffffff" />
            </TouchableOpacity>

            {/* Micro indicator */}
            <View className="flex-row items-center justify-center space-x-1.5 py-1">
              <Feather name="trending-up" size={15} color="#725b38" />
              <Text className="text-[11px] text-[#4e4542]">
                Artisans share 3.4x faster on WhatsApp groups
              </Text>
            </View>
          </View>

          {/* KEY FEATURE 2: ONDC Network Listing Integration Toggle Card */}
          <View className="w-full bg-[#efeeea] rounded-2xl p-4 shadow-sm flex-col space-y-3 mt-3 border border-[#e4e2de]">
            <View className="flex-row items-start justify-between space-x-3">
              <View className="flex-row space-x-3 flex-1">
                {/* ONDC Badge Icon */}
                <View className="w-11 h-11 rounded-2xl bg-[#fedeb2] items-center justify-center shrink-0 shadow-xs">
                  <Feather name="share-2" size={22} color="#281800" />
                </View>
                <View className="flex-col flex-1">
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-[16px] font-bold text-[#140c09] leading-snug">
                      List on ONDC Network
                    </Text>
                    <View className="px-2 py-0.5 rounded-full bg-[#2b211e]">
                      <Text className="text-white text-[9px] font-bold uppercase tracking-wider">
                        Govt of India
                      </Text>
                    </View>
                  </View>
                  <Text className="text-[12px] text-[#4e4542] mt-0.5">
                    ओएनडीसी नेटवर्क पर लाइव रखें
                  </Text>
                </View>
              </View>

              {/* Accessible iOS-style Switch (min 48x48 hit zone) */}
              <View className="w-12 h-12 items-center justify-center">
                <Switch
                  value={isOndcEnabled}
                  onValueChange={handleToggleOndc}
                  trackColor={{ false: '#d2c3c0', true: '#725b38' }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Network explanation and partner badge strip */}
            <View className="flex-col space-y-2 pt-1">
              <Text className="text-[12px] text-[#4e4542] leading-relaxed">
                Make your saree discoverable across{' '}
                <Text className="text-[#140c09] font-bold">
                  Paytm, Mystore, Pincode & Tata Neu
                </Text>{' '}
                automatically with zero added platform fee.
              </Text>

              <View className="flex-row flex-wrap gap-1.5 pt-1">
                {['Paytm', 'Mystore', 'PhonePe Pincode', 'Magicpin'].map((partner) => (
                  <View
                    key={partner}
                    className="px-2.5 py-1 rounded-full bg-white shadow-xs"
                  >
                    <Text className="text-[11px] font-semibold text-[#1b1c1a]">
                      {partner}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* SECONDARY ACTIONS & LOOP CAPTURE */}
          <View className="flex-col space-y-3 pt-4">
            {/* View in Shop Catalog Button (min 50px) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('MainTabs', { screen: 'Catalog' });
                } else {
                  Alert.alert('Shop Catalog', 'Opening Artisan Catalog...');
                }
              }}
              className="w-full min-h-[50px] px-6 rounded-full bg-[#efeeea] flex-row items-center justify-center space-x-2 active:scale-[0.98] shadow-xs"
            >
              <Feather name="shopping-bag" size={18} color="#140c09" />
              <Text className="text-[14px] font-bold text-[#140c09]">
                View in Shop Catalog • दुकान में देखें
              </Text>
            </TouchableOpacity>

            {/* Add Another Craft Button (min 50px) */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                if (navigation?.replace) {
                  navigation.replace('Capture');
                } else if (navigation?.navigate) {
                  navigation.navigate('Capture');
                } else {
                  Alert.alert('Add Craft', 'Opening AI Studio Camera...');
                }
              }}
              className="w-full min-h-[50px] px-6 rounded-full bg-[#140c09] flex-row items-center justify-center space-x-2 active:scale-[0.98] shadow-md"
            >
              <Feather name="camera" size={18} color="#ffffff" />
              <Text className="text-[14px] font-bold text-white">
                Add Another Craft • दूसरा उत्पाद जोड़ें
              </Text>
            </TouchableOpacity>
          </View>

          {/* Customer Care & Help line */}
          <View className="flex-row items-center justify-center space-x-2 pt-5 pb-2 text-center">
            <Feather name="headphones" size={16} color="#725b38" />
            <Text className="text-[12px] text-[#4e4542]">
              Need help? Dial Sahayata Kendra 1800-SHILP-HELP
            </Text>
          </View>
        </ScrollView>

        {/* INTERACTIVE TOAST FEEDBACK PILL */}
        {toastMessage && (
          <View className="absolute bottom-6 self-center w-[90%] max-w-[360px] bg-[#30312e] px-4 py-3 rounded-full shadow-xl flex-row items-center space-x-3 z-50">
            <View className="w-6 h-6 rounded-full bg-[#725b38] items-center justify-center">
              <Ionicons name="checkmark" size={16} color="#ffffff" />
            </View>
            <Text className="text-[12px] font-medium text-[#f2f0ed] flex-1">
              {toastMessage}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ReviewScreenReactNative;
