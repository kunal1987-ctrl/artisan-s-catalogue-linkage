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
  ActivityIndicator,
} from 'react-native';
import {
  MaterialIcons,
  Ionicons,
  Feather,
} from '@expo/vector-icons';

export interface DetailsScreenProps {
  navigation?: any;
}

export const DetailsScreenReactNative: React.FC<DetailsScreenProps> = ({ navigation }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [showOriginalImage, setShowOriginalImage] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);

  // Editable form fields
  const [title, setTitle] = useState<string>('Handwoven Blue Pure Silk Saree');
  const [price, setPrice] = useState<string>('1,200');
  const [description, setDescription] = useState<string>(
    'Exquisite handwoven blue saree crafted from pure mulberry silk with fine golden zari border work. Traditional artisan weave taking over 4 days to complete. Lightweight, breathable, and wedding-ready.'
  );
  const [tags, setTags] = useState<string[]>([
    'Handmade',
    '100% Silk',
    'Dry Clean Only',
    'Mulberry Weave',
  ]);

  const toggleLanguage = () => {
    if (lang === 'en') {
      setLang('hi');
      Alert.alert('भाषा बदली गई', 'भाषा बदलकर हिंदी कर दी गई है (Hindi)');
    } else {
      setLang('en');
      Alert.alert('Language Switch', 'Language switched to English');
    }
  };

  const handleEditTitle = () => {
    if (Alert.prompt) {
      Alert.prompt('Edit Title', 'Enter new product title', (text) => {
        if (text) setTitle(text);
      });
    } else {
      Alert.alert('Edit Title', `Current title: "${title}"`);
    }
  };

  const handleEditPrice = () => {
    if (Alert.prompt) {
      Alert.prompt('Edit Price (₹)', 'Enter listing price', (text) => {
        if (text) setPrice(text);
      });
    } else {
      Alert.alert('Edit Price', `Current price: ₹${price}`);
    }
  };

  const handleEditDescription = () => {
    if (Alert.prompt) {
      Alert.prompt('Edit Description', 'Enter product story & specifications', (text) => {
        if (text) setDescription(text);
      });
    } else {
      Alert.alert('Edit Description', `Current description: "${description}"`);
    }
  };

  const handleAddTag = () => {
    if (Alert.prompt) {
      Alert.prompt('Add Tag', 'Enter custom product tag', (text) => {
        if (text && !tags.includes(text)) setTags([...tags, text]);
      });
    } else {
      Alert.alert('Add Tag', 'Adding new artisan craft tag...');
    }
  };

  const handlePublish = () => {
    if (isPublishing) return;
    setIsPublishing(true);

    setTimeout(() => {
      setIsPublishing(false);
      setIsPublished(true);
      if (navigation?.navigate) {
        navigation.navigate('Success');
      } else {
        Alert.alert(
          lang === 'en' ? 'Published Live! 🎉' : 'प्रकाशित हो गया! 🎉',
          lang === 'en'
            ? `"${title}" is now published to your shop catalog and synced with ONDC.`
            : `"${title}" अब आपके दुकान कैटलॉग में प्रकाशित और ONDC से लिंक हो चुका है।`
        );
      }
    }, 1200);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fbf9f5]">
      <StatusBar barStyle="dark-content" />

      {/* FIXED TOP HEADER (pt-safe, 48px+ touch targets) */}
      <View className="h-16 px-4 flex-row items-center justify-between bg-[#fbf9f5]/90 border-b border-[#eae8e4] z-50">
        <View className="flex-row items-center space-x-2 flex-1 min-w-0">
          {/* Back Button (48x48px tap target) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('Capture');
              } else {
                Alert.alert('Go Back', 'Returning to camera capture stage...');
              }
            }}
            className="w-12 h-12 items-center justify-center rounded-full active:scale-95 -ml-2"
          >
            <Feather name="arrow-left" size={22} color="#140c09" />
          </TouchableOpacity>

          <Text className="text-[20px] font-bold text-[#140c09] tracking-normal truncate">
            {lang === 'en' ? 'Item Details' : 'उत्पाद विवरण'}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2.5">
          {/* Language Switch Button (48px tap height) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleLanguage}
            className="min-h-[44px] px-3 rounded-full bg-[#eae8e4] border border-[#d2c3c0]/40 flex-row items-center justify-center active:scale-95 shadow-xs"
          >
            <Text className="font-semibold text-[13px] text-[#140c09]">
              {lang === 'en' ? 'A / अ' : 'अ / A'}
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
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1 bg-[#fbf9f5]"
      >
        {/* PROGRESS STEPPER SUBHEADER */}
        <View className="px-4 py-2.5 flex-row items-center justify-between bg-[#f5f3ef]/80 border-b border-[#eae8e4]">
          <View className="flex-row items-center space-x-2">
            <View className="w-2 h-2 rounded-full bg-[#725b38]" />
            <Text className="text-[11px] font-bold text-[#725b38] uppercase tracking-widest">
              Step 2 of 2: Confirm Listing
            </Text>
          </View>
          <View className="flex-row items-center space-x-1">
            <View className="w-6 h-1 rounded-full bg-[#e4e2de]" />
            <View className="w-8 h-1 rounded-full bg-[#140c09]" />
          </View>
        </View>

        <View className="px-4 pt-3 flex-col space-y-4">
          {/* HERO PRODUCT PREVIEW BOX */}
          <View className="relative w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-[#efeeea]">
            {/* Media Aspect 4:5 */}
            <View className="relative w-full aspect-[4/5] bg-[#f5f3ef] items-center justify-center overflow-hidden">
              <Image
                source={{
                  uri: showOriginalImage
                    ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV3-xCzN9TdTuHufN2Eugbk_EZBDJA_VggGkHJFBe14GOnP9jvtR6Ee9vNq-Aw1XP7TDBVxytmQRP9igWfX9KFvxyeutdk5zYrrX_dgvibmIohF6cCEOqXwbxZiarLCs_p9eDtD_QU3cljge8SkKKNWcep6mY5_T-xCnBJj2niY32GH3Pk3XlykQMu8lqIg701PTDGB7sn-cna7dpzkjeV1gVX7Ke_l5Q6i0XTqcNXl1n8Gjv10NB9'
                    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEq1Hkh8RmlAyVeK5gWu6j_YRSmgysFrP4oUBkyOyD-0L2PxQK2EPYOlD04SdKeyqcpoxMe-trihF63F1YYR0jB8DwGc_8Qj4FoI2OZy3SaWUq9mO9qZZmgAy_RFvRLSeQZPWsO_KnYucJlxSK8nl3V0KXJQSGkbwChhywzR_j7zm9kvIy-L9F8qh8ohekptBKtp2RWXgNgAH5wZtxJmMSbiXiLGP0BvGR-yhNeborvi6b1EC-3_NJ',
                }}
                className="w-full h-full object-cover"
              />

              {/* AI Enhanced Pill Badge (Top Left) */}
              <View className="absolute top-3 left-3 flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm">
                <MaterialIcons name="auto-awesome" size={15} color="#B39366" />
                <Text className="text-[11px] font-bold text-[#140c09] tracking-wider uppercase">
                  {showOriginalImage ? 'Original Capture' : 'AI Enhanced Studio'}
                </Text>
              </View>

              {/* Floating Image Action Controls (Bottom Right, 48x48px tap targets) */}
              <View className="absolute bottom-3 right-3 flex-row items-center space-x-2">
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Alert.alert('Zoom Image', 'Opening high-resolution fabric texture preview...')}
                  className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md items-center justify-center shadow-md active:scale-95"
                >
                  <Feather name="zoom-in" size={20} color="#140c09" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => Alert.alert('Crop Image', 'Adjusting frame bounding edges...')}
                  className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md items-center justify-center shadow-md active:scale-95"
                >
                  <Feather name="crop" size={20} color="#140c09" />
                </TouchableOpacity>
              </View>

              {/* Voice Note Processed Badge (Bottom Left) */}
              <View className="absolute bottom-3 left-3 flex-row items-center space-x-2 px-3 py-1.5 rounded-full bg-[#191312]/85 backdrop-blur-md shadow-sm">
                <Feather name="mic" size={14} color="#ffdbcd" />
                <Text className="text-[11px] font-medium text-white tracking-wider">
                  Generated from Voice
                </Text>
              </View>
            </View>

            {/* Quick Quality Note & Original Toggle Strip */}
            <View className="px-4 py-2.5 bg-[#F3EFEA] flex-row items-center justify-between border-t border-[#E8E2D9]">
              <View className="flex-row items-center space-x-2">
                <MaterialIcons name="verified" size={16} color="#725b38" />
                <Text className="text-[12px] text-[#4e4542]">
                  Lighting & drape balanced via AI Camera
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowOriginalImage(!showOriginalImage)}
              >
                <Text className="text-[11px] font-bold text-[#725b38] underline">
                  {showOriginalImage ? 'Show Enhanced' : 'Original'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LISTING DETAILS FORM CARDS */}
          <View className="flex-col space-y-3">
            {/* Card 1: Product Title & Category */}
            <View className="rounded-2xl p-4 bg-white shadow-sm border border-[#efeeea]">
              <View className="flex-row items-start justify-between space-x-2">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2 mb-1.5">
                    <View className="px-2.5 py-0.5 rounded-full bg-[#F5ECE7]">
                      <Text className="text-[10px] font-bold text-[#140c09] uppercase tracking-wider">
                        Textiles & Sarees
                      </Text>
                    </View>
                    <View className="w-1 h-1 rounded-full bg-[#d2c3c0]" />
                    <Text className="text-[11px] text-[#4e4542]">Title</Text>
                  </View>
                  <Text className="text-[20px] text-[#140c09] font-bold tracking-tight leading-snug">
                    {title}
                  </Text>
                </View>

                {/* Edit Title Button (48x48px tap target) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleEditTitle}
                  className="w-12 h-12 rounded-full bg-[#f5f3ef] items-center justify-center shrink-0 active:scale-90"
                >
                  <Feather name="edit-2" size={18} color="#140c09" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 2: AI Suggested Price */}
            <View className="rounded-2xl p-4 bg-white shadow-sm border border-[#efeeea]">
              <View className="flex-row items-start justify-between space-x-2">
                <View className="flex-1">
                  <View className="flex-row items-center space-x-1.5 mb-1">
                    <MaterialIcons name="insights" size={16} color="#B39366" />
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-[#4e4542]">
                      AI Suggested Price
                    </Text>
                  </View>

                  <View className="flex-row items-baseline space-x-2 mt-1">
                    <Text className="text-[30px] font-bold text-[#725b38] leading-none">
                      ₹ {price}
                    </Text>
                    <Text className="text-[13px] text-[#4e4542] font-medium">/ unit</Text>
                  </View>

                  <View className="mt-2.5 flex-row items-center space-x-1.5">
                    <MaterialIcons name="location-on" size={15} color="#725b38" />
                    <Text className="text-[12px] text-[#4e4542]">
                      Calibrated against similar silk handlooms in{' '}
                      <Text className="font-bold text-[#140c09]">Varanasi</Text>
                    </Text>
                  </View>
                </View>

                {/* Edit Price Button (48x48px tap target) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleEditPrice}
                  className="w-12 h-12 rounded-full bg-[#f5f3ef] items-center justify-center shrink-0 active:scale-90"
                >
                  <Feather name="edit-2" size={18} color="#140c09" />
                </TouchableOpacity>
              </View>

              {/* Estimated Artisan Payout Strip */}
              <View className="mt-3 pt-1 flex-row items-center justify-between bg-[#f5f3ef] rounded-xl px-3 py-2">
                <Text className="text-[12px] text-[#4e4542] font-medium">
                  Artisan Payout (Est.)
                </Text>
                <Text className="text-[15px] text-[#140c09] font-bold">
                  ₹ 1,140
                </Text>
              </View>
            </View>

            {/* Card 3: AI Generated Description & Story */}
            <View className="rounded-2xl p-4 bg-white shadow-sm border border-[#efeeea]">
              <View className="flex-row items-start justify-between space-x-2 mb-2">
                <View className="flex-row items-center space-x-1.5">
                  <MaterialIcons name="auto-stories" size={16} color="#B39366" />
                  <Text className="text-[11px] font-bold text-[#4e4542] uppercase tracking-wider">
                    Story & Specifications
                  </Text>
                </View>

                {/* Edit Description Button (48x48px tap target) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleEditDescription}
                  className="w-12 h-12 rounded-full bg-[#f5f3ef] items-center justify-center shrink-0 active:scale-90"
                >
                  <Feather name="edit-2" size={18} color="#140c09" />
                </TouchableOpacity>
              </View>

              <Text className="text-[14px] text-[#4e4542] leading-relaxed">
                {description}
              </Text>

              {/* Dynamic Voice Note Quotation Pill */}
              <View className="mt-3 p-3 rounded-xl bg-[#F3EFEA] flex-row items-start space-x-2.5">
                <MaterialIcons
                  name="graphic-eq"
                  size={18}
                  color="#B39366"
                  style={{ marginTop: 2 }}
                />
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-[#4e4542] mb-0.5">
                    Extracted from Voice Note
                  </Text>
                  <Text className="text-[12px] text-[#140c09] italic">
                    “Traditional warp technique passed through 3 generations...”
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* AI PRODUCT TAGS SECTION */}
          <View className="flex-col space-y-2 mt-1">
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-[11px] font-bold text-[#4e4542] uppercase tracking-widest">
                Product Tags
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleAddTag}>
                <Text className="text-[11px] font-bold text-[#725b38] underline">
                  + Add Tag
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-2 pt-1">
              {tags.map((tag, idx) => (
                <View
                  key={idx}
                  className="h-9 px-4 rounded-full bg-white border border-[#efeeea] shadow-xs flex-row items-center space-x-1.5"
                >
                  <MaterialIcons
                    name={
                      tag.includes('Handmade')
                        ? 'front-hand'
                        : tag.includes('Silk')
                        ? 'check-circle'
                        : tag.includes('Dry Clean')
                        ? 'dry-cleaning'
                        : 'local-florist'
                    }
                    size={15}
                    color="#B39366"
                  />
                  <Text className="text-[13px] font-medium text-[#140c09]">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM FOOTER ACTION BAR */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#fbf9f5]/95 border-t border-[#eae8e4] px-4 pt-3 pb-6 shadow-2xl flex-col space-y-2 z-40">
        <View className="flex-row items-center space-x-2">
          {/* Retake / Redo Action (min 48px tap target) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (navigation?.goBack) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('Capture');
              } else {
                Alert.alert('Retake', 'Returning to camera studio to snap fresh craft photos...');
              }
            }}
            className="h-14 px-4 rounded-full bg-[#f5f3ef] flex-row items-center justify-center space-x-1.5 active:scale-95 shadow-xs"
          >
            <Feather name="rotate-ccw" size={18} color="#140c09" />
            <Text className="text-[14px] font-bold text-[#140c09]">Retake</Text>
          </TouchableOpacity>

          {/* Massive Primary Publish Button (min 56px height) */}
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isPublishing}
            onPress={handlePublish}
            className={`h-14 flex-1 rounded-full flex-row items-center justify-center space-x-2 shadow-md active:scale-[0.98] ${
              isPublished
                ? 'bg-[#725b38]'
                : 'bg-[#2b211e]'
            }`}
          >
            {isPublishing ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-[16px] font-bold text-white tracking-wide">
                  Publishing...
                </Text>
              </>
            ) : isPublished ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text className="text-[16px] font-bold text-white tracking-wide">
                  Published Live!
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[18px]">✨</Text>
                <Text className="text-[16px] font-bold text-white tracking-wide">
                  Publish to Shop
                </Text>
                <Text className="text-[18px]">🚀</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Offline-First Sync Helper Text Row */}
        <View className="flex-row items-center justify-center space-x-1.5 pt-0.5">
          <Text className="text-[12px]">☁️✓</Text>
          <Text className="text-[12px] font-medium text-[#4e4542]">
            Saves locally if offline. Syncs automatically later.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DetailsScreenReactNative;
