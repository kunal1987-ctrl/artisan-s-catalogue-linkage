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
} from 'react-native';
import {
  MaterialIcons,
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

interface OrderItem {
  id: string;
  orderNumber: string;
  timeAgo: string;
  urgency: string;
  sourceType: 'ondc' | 'whatsapp';
  sourceLabel: string;
  title: string;
  quantity: string;
  price: string;
  paymentStatus: string;
  isPaidOnline: boolean;
  destination: string;
  imageUrl: string;
  isPacked: boolean;
  hasVoiceNote?: boolean;
  voiceNoteText?: string;
  voiceDuration?: string;
}

export interface OrdersScreenProps {
  navigation?: any;
}

export const OrdersScreenReactNative: React.FC<OrdersScreenProps> = ({ navigation }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [activeFilter, setActiveFilter] = useState<'pending' | 'packed' | 'delivered'>('pending');
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'orders' | 'profile'>('orders');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: '1',
      orderNumber: 'KS-8921',
      timeAgo: '10m ago',
      urgency: 'Requires accept today',
      sourceType: 'ondc',
      sourceLabel: 'ONDC via Mystore',
      title: 'Handwoven Blue Pure Silk Saree',
      quantity: 'Qty: 1 Unit',
      price: '₹1,200',
      paymentStatus: 'Paid Online • भुगतान हुआ',
      isPaidOnline: true,
      destination: 'Ship to: Lucknow, UP (ONDC Pickup Agent)',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAhQyBCcHXxppvzIjiac0wXbDfq62WaB0pTHDam0UqgMIt80v8bTscpCYepAYhHzwyqdSDVwKBNGDU9Lh-0pgmb6R_Xsdf2mYuyI5v7xHSnUvaB5oyD0DKaxQR9MG1xRqs4oJnxr4fOtRfF0qz1JxSpe60gPE0oIJiv6Qr1AYzi90D-zTBtf49gaWbwbab-kE-5l2lN0FBHVhzoCrgX4nfYwPD_5qcNZV6HV33lWUnDsCVeVxBWDZ5M',
      isPacked: false,
    },
    {
      id: '2',
      orderNumber: 'KS-8919',
      timeAgo: '35m ago',
      urgency: 'Direct Customer',
      sourceType: 'whatsapp',
      sourceLabel: 'WhatsApp Direct',
      title: 'Handcrafted Brass Puja Diya',
      quantity: 'Qty: 2 Units',
      price: '₹900',
      paymentStatus: 'Cash on Delivery (COD)',
      isPaidOnline: false,
      destination: 'Ship to: Varanasi Local Delivery',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuADLHGnD6b5Mm5Kw6N6ujayRO4j8q3V_3lPPR6jofXW8d6UpwFr5ROvLMj56XzD8ReYxRehGbr2PQeYAe6ypCJ_6nk1eBFMY6s0aQREkKO7tE1mFg6EQzsJ3_1CuY__0M3Cc_R3gDrtdl2831xaH86wDkZt_ZPSSo_gI8oiNrmjWotyxr4Lt_om_Uin7S3GW-j2bvNEcaYqzwKGYuGrvgbXyF_Mr0htSeCB1AhU9_zyueMDCUW5wsWP',
      isPacked: false,
      hasVoiceNote: true,
      voiceNoteText: '“Please pack safely for Diwali”',
      voiceDuration: '0:12',
    },
    {
      id: '3',
      orderNumber: 'KS-8915',
      timeAgo: '2 hours ago',
      urgency: 'ONDC Pickup Agent',
      sourceType: 'ondc',
      sourceLabel: 'ONDC via Paytm',
      title: 'Handmade Terracotta Pitcher',
      quantity: 'Qty: 1 Unit',
      price: '₹200',
      paymentStatus: 'Paid Online • प्रीपेड',
      isPaidOnline: true,
      destination: 'Ship to: Varanasi, UP',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBIV_cz3e1s9PecVuCoGvMdgmVr148ixCtI8BtKEU7mdqCNcwrLRU5CKHEU1i-wQ7J1_mMLxTz_WcLs43UwJEptHZiuftIiXk1bgpQcNFt1oZ3J5vgnuoOACpsBbWUMbgpyeZRA9ILNCkINyizTmNUDUwDz_oksdIc_GVmWmnA0ofIdZuVjYVeygDD9wIglXqPy1XQ4eM48-E2szZRpH5-1rZ0Upwzn8d6POJGUKlaFuHz19Yi2WFd1',
      isPacked: false,
    },
  ]);

  const pendingCount = orders.filter((o) => !o.isPacked).length;
  const packedCount = 5 + orders.filter((o) => o.isPacked).length;

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  const toggleLanguage = () => {
    if (lang === 'en') {
      setLang('hi');
      showToast('भाषा बदलकर हिंदी कर दी गई है (Hindi)');
    } else {
      setLang('en');
      showToast('Language preference updated to English');
    }
  };

  const handleVoiceListen = () => {
    showToast('🔊 "आपके पास 3 नए आर्डर हैं। पैक करने के लिए नीचे बटन दबाएं।"');
    Alert.alert(
      lang === 'en' ? 'Voice Instructions' : 'ध्वनि निर्देश',
      '🔊 "नमस्ते रमेश जी! आपके पास नए आर्डर आए हैं। आज ही भेजने के लिए स्वीकारें और पैक करें बटन दबाएं। (3 new orders ready for packing today)"'
    );
  };

  const handleAcceptAndPack = (order: OrderItem) => {
    if (order.isPacked) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, isPacked: true } : o))
    );

    showToast(`ऑर्डर #${order.orderNumber} पैक हो गया! Ready for pickup.`);
    Alert.alert(
      'Order Packed! 🎉',
      `Order #${order.orderNumber} has been marked as Packed & ready for courier dispatch.`
    );
  };

  const handleMessageBuyer = (order: OrderItem) => {
    Alert.alert(
      'WhatsApp Direct Chat',
      `Opening WhatsApp chat with buyer of #${order.orderNumber} (${order.title}).`
    );
  };

  const handlePlayBuyerVoice = (order: OrderItem) => {
    showToast('Playing customer voice note (0:12)...');
    Alert.alert(
      'Customer Audio Message',
      `🎙️ Audio playback for Order #${order.orderNumber}:\n\n"नमस्ते! कृपया दिवाली उपहार के लिए इस दीये को सुरक्षित पैक कीजिएगा। धन्यवाद!"`
    );
  };

  const handleViewSlip = (order: OrderItem) => {
    Alert.alert(
      'Packaging Slip • पर्ची',
      `Order Slip #${order.orderNumber}\nItem: ${order.title}\nAmount: ${order.price}\nDestination: ${order.destination}\nCarrier: ONDC Logistics`
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'pending') return !order.isPacked;
    if (activeFilter === 'packed') return order.isPacked;
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#fbf9f5]">
      <StatusBar barStyle="dark-content" />

      {/* TOP FIXED NAVIGATION HEADER (pt-safe, 48px+ targets) */}
      <View className="bg-white px-4 py-3 shadow-xs flex-col space-y-3 border-b border-[#eae8e4] z-40">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            {/* Go Back Button (48x48px tap target) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('Dashboard', 'Going back to Artisan Home Dashboard...')}
              className="w-12 h-12 rounded-full bg-[#f5f3ef] items-center justify-center active:bg-[#eae8e4]"
            >
              <Feather name="arrow-left" size={22} color="#140c09" />
            </TouchableOpacity>

            <View className="flex-col">
              <Text className="text-[20px] font-bold text-[#140c09] leading-tight">
                {lang === 'en' ? 'Orders Inbox' : 'ऑर्डर इनबॉक्स'}
              </Text>
              <Text className="text-[12px] text-[#4e4542] font-medium">
                {lang === 'en' ? 'Incoming Orders (Lite)' : 'नए ऑर्डर (Lite)'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            {/* Language Switcher Pill (48px tap height) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleLanguage}
              className="h-12 px-3.5 flex-row items-center space-x-1.5 rounded-full bg-[#efeeea] border border-[#d2c3c0]/40 active:scale-95 shadow-xs"
            >
              <MaterialIcons name="translate" size={17} color="#725b38" />
              <Text className="text-[13px] font-bold text-[#140c09]">
                {lang === 'en' ? 'A / अ' : 'अ / A'}
              </Text>
            </TouchableOpacity>

            {/* Notifications Bell with Dot (48x48px tap target) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('Order Alerts', 'You have 3 incoming orders requiring packaging.')}
              className="relative w-12 h-12 rounded-full bg-[#f5f3ef] items-center justify-center active:bg-[#eae8e4]"
            >
              <Ionicons name="notifications-outline" size={22} color="#140c09" />
              <View className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#725b38] rounded-full" />
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK STATUS FILTER PILLS (48px height targets) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2 py-1"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveFilter('pending')}
            className={`h-12 px-4 rounded-full flex-row items-center space-x-2 shadow-xs ${
              activeFilter === 'pending'
                ? 'bg-[#2b211e]'
                : 'bg-[#f5f3ef]'
            }`}
          >
            <Text
              className={`text-[13px] font-bold ${
                activeFilter === 'pending' ? 'text-white' : 'text-[#4e4542]'
              }`}
            >
              Pending Action
            </Text>
            <View className="w-5 h-5 rounded-full bg-[#725b38] items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {pendingCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveFilter('packed')}
            className={`h-12 px-4 rounded-full flex-row items-center space-x-2 ${
              activeFilter === 'packed'
                ? 'bg-[#2b211e]'
                : 'bg-[#f5f3ef]'
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                activeFilter === 'packed' ? 'text-white font-bold' : 'text-[#4e4542]'
              }`}
            >
              Packed
            </Text>
            <View className="w-5 h-5 rounded-full bg-[#e4e2de] items-center justify-center">
              <Text className="text-[#140c09] text-[10px] font-bold">
                {packedCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setActiveFilter('delivered')}
            className={`h-12 px-4 rounded-full flex-row items-center space-x-2 ${
              activeFilter === 'delivered'
                ? 'bg-[#2b211e]'
                : 'bg-[#f5f3ef]'
            }`}
          >
            <Text
              className={`text-[13px] font-medium ${
                activeFilter === 'delivered' ? 'text-white font-bold' : 'text-[#4e4542]'
              }`}
            >
              Delivered
            </Text>
            <View className="w-5 h-5 rounded-full bg-[#e4e2de] items-center justify-center">
              <Text className="text-[#140c09] text-[10px] font-bold">14</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="flex-1 bg-[#fbf9f5]"
      >
        {/* LOW-LITERACY VOICE GUIDE & LOCAL SYNC NOTICE */}
        <View className="px-4 pt-4 flex-col space-y-2.5">
          {/* Voice Prompt Card */}
          <View className="bg-[#ffdbcd] p-4 rounded-2xl shadow-sm flex-row items-center justify-between space-x-3">
            <View className="flex-row items-start space-x-2.5 flex-1">
              <Feather name="mic" size={24} color="#725b38" style={{ marginTop: 2 }} />
              <View className="flex-col flex-1">
                <Text className="text-[15px] font-bold text-[#2a170e] leading-snug">
                  {pendingCount} नए आर्डर तैयार हैं!
                </Text>
                <Text className="text-[12px] text-[#5b4136] leading-tight mt-0.5">
                  Tap 'Accept & Pack' to dispatch today.
                </Text>
              </View>
            </View>

            {/* Voice Speaker Accessibility Button (48x48px tap target) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleVoiceListen}
              className="w-12 h-12 rounded-full bg-[#2b211e] items-center justify-center shadow-md active:scale-90"
            >
              <Feather name="volume-2" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Local Offline Sync Pill Banner */}
          <View className="flex-row items-center justify-between px-4 py-2 bg-[#f5f3ef] rounded-full border border-[#efeeea]">
            <View className="flex-row items-center space-x-1.5">
              <MaterialIcons name="cloud-done" size={17} color="#25D366" />
              <Text className="text-[12px] font-semibold text-[#4e4542]">
                Stored locally • सुरक्षित ऑफलाइन डेटा
              </Text>
            </View>
            <View className="w-2 h-2 rounded-full bg-[#25D366]" />
          </View>
        </View>

        {/* ORDERS FEED */}
        <View className="px-4 pt-3 flex-col space-y-4">
          {filteredOrders.map((order) => (
            <View
              key={order.id}
              className={`bg-white rounded-2xl p-4 shadow-sm flex-col space-y-3 border border-[#efeeea] ${
                order.isPacked ? 'opacity-70 bg-[#fbf9f5]' : ''
              }`}
            >
              {/* Order Header Info */}
              <View className="flex-row items-start justify-between space-x-2">
                <View className="flex-col">
                  <View className="flex-row items-center space-x-1.5">
                    <Text className="text-[14px] font-bold text-[#140c09]">
                      #{order.orderNumber}
                    </Text>
                    <Text className="text-[#4e4542]">•</Text>
                    <Text className="text-[12px] text-[#4e4542]">{order.timeAgo}</Text>
                  </View>
                  <Text
                    className={`text-[11px] font-bold mt-0.5 ${
                      order.isPacked
                        ? 'text-[#065f46]'
                        : order.sourceType === 'whatsapp'
                        ? 'text-[#752801]'
                        : 'text-[#725b38]'
                    }`}
                  >
                    {order.isPacked ? 'Packed • Ready for Pickup' : order.urgency}
                  </Text>
                </View>

                {/* Source Tag (ONDC / WhatsApp) */}
                <View
                  className={`flex-row items-center space-x-1 px-3 py-1.5 rounded-full ${
                    order.sourceType === 'whatsapp'
                      ? 'bg-[#25D366]/15'
                      : 'bg-[#eae8e4]'
                  }`}
                >
                  {order.sourceType === 'whatsapp' ? (
                    <Ionicons name="logo-whatsapp" size={15} color="#1A3824" />
                  ) : (
                    <MaterialCommunityIcons name="hubspot" size={15} color="#140c09" />
                  )}
                  <Text
                    className={`text-[11px] font-bold ${
                      order.sourceType === 'whatsapp'
                        ? 'text-[#1A3824]'
                        : 'text-[#140c09]'
                    }`}
                  >
                    {order.sourceLabel}
                  </Text>
                </View>
              </View>

              {/* Item Row Details */}
              <View className="flex-row items-center space-x-3 bg-[#f5f3ef] p-3 rounded-xl">
                <Image
                  source={{ uri: order.imageUrl }}
                  className="w-[72px] h-[72px] rounded-lg object-cover"
                />

                <View className="flex-col flex-1 min-w-0">
                  <Text
                    className="text-[15px] font-bold text-[#140c09] truncate"
                    numberOfLines={1}
                  >
                    {order.title}
                  </Text>

                  <View className="flex-row items-center space-x-2 mt-0.5">
                    <Text className="text-[12px] text-[#4e4542]">{order.quantity}</Text>
                    <Text className="text-[#4e4542]">•</Text>
                    <Text className="text-[14px] font-bold text-[#140c09]">
                      {order.price}
                    </Text>
                  </View>

                  <View className="flex-row items-center space-x-1 mt-1">
                    <MaterialIcons
                      name={order.isPaidOnline ? 'check-circle' : 'payments'}
                      size={15}
                      color={order.isPaidOnline ? '#25D366' : '#725b38'}
                    />
                    <Text
                      className={`text-[11px] font-bold ${
                        order.isPaidOnline ? 'text-[#1A3824]' : 'text-[#725b38]'
                      }`}
                    >
                      {order.paymentStatus}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Customer Voice Note Banner (If direct WhatsApp order) */}
              {order.hasVoiceNote && (
                <View className="flex-row items-center justify-between bg-[#efeeea] p-2.5 rounded-xl">
                  <View className="flex-row items-center space-x-2 flex-1 pr-2">
                    <MaterialIcons name="graphic-eq" size={20} color="#725b38" />
                    <Text
                      className="text-[12px] text-[#140c09] italic flex-1"
                      numberOfLines={1}
                    >
                      {order.voiceNoteText}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handlePlayBuyerVoice(order)}
                    className="h-10 px-3 rounded-full bg-[#e4e2de] flex-row items-center space-x-1 active:scale-95"
                  >
                    <Feather name="play" size={14} color="#140c09" />
                    <Text className="text-[11px] font-bold text-[#140c09]">
                      {order.voiceDuration}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Destination Specs */}
              <View className="flex-row items-center space-x-2 px-1">
                <Feather name="truck" size={16} color="#4e4542" />
                <Text className="text-[12px] text-[#4e4542] truncate flex-1" numberOfLines={1}>
                  {order.destination}
                </Text>
              </View>

              {/* Action Panel */}
              <View className="flex-col space-y-2 pt-1">
                {/* Accept & Pack Button (Min 52px height) */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => handleAcceptAndPack(order)}
                  className={`w-full min-h-[52px] h-[52px] rounded-full flex-row items-center justify-center space-x-2 shadow-md active:scale-95 ${
                    order.isPacked
                      ? 'bg-[#1A3824]'
                      : 'bg-[#2b211e]'
                  }`}
                >
                  <MaterialIcons
                    name={order.isPacked ? 'check-circle' : 'inventory-2'}
                    size={20}
                    color={order.isPacked ? '#25D366' : '#ffffff'}
                  />
                  <Text className="text-[14px] font-bold text-white tracking-wide">
                    {order.isPacked
                      ? 'Packed • पैक हो गया'
                      : 'Accept & Pack • स्वीकारें'}
                  </Text>
                </TouchableOpacity>

                {/* Sub-actions */}
                {order.sourceType === 'whatsapp' ? (
                  /* WhatsApp Direct Message Buyer Button (min 48px height) */
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleMessageBuyer(order)}
                    className="w-full min-h-[48px] h-[48px] rounded-xl bg-[#25D366] flex-row items-center justify-center space-x-2 shadow-sm active:scale-95"
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
                    <Text className="text-[13px] font-bold text-white">
                      Message Buyer • ग्राहक को मैसेज करें
                    </Text>
                  </TouchableOpacity>
                ) : (
                  /* View Slip Button (min 48px height) */
                  <View className="flex-row items-center justify-start pt-0.5">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleViewSlip(order)}
                      className="min-h-[44px] px-3 rounded-full flex-row items-center space-x-1.5 active:bg-[#f5f3ef]"
                    >
                      <Feather name="file-text" size={17} color="#725b38" />
                      <Text className="text-[13px] font-bold text-[#725b38]">
                        View Slip • पर्ची देखें
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}

          {/* Artisanal Encouragement Footer Note */}
          <View className="items-center justify-center py-4 space-y-1">
            <MaterialIcons name="verified" size={22} color="#725b38" />
            <Text className="text-[12px] font-semibold text-[#4e4542]">
              100% Guaranteed Payouts via ONDC Settlements
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* STICKY BOTTOM NAVIGATION BAR (Fixed bottom, 48px+ targets, standalone only) */}
      {!navigation && (
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-white/95 border-t border-[#eae8e4] flex-row items-center justify-around z-40 shadow-lg">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('home')}
            className="w-16 h-14 items-center justify-center"
          >
            <MaterialCommunityIcons
              name="home-variant-outline"
              size={24}
              color={activeTab === 'home' ? '#140c09' : '#4e4542'}
            />
            <Text
              className={`text-[11px] mt-0.5 ${
                activeTab === 'home' ? 'font-bold text-[#140c09]' : 'text-[#4e4542]'
              }`}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('catalog')}
            className="w-16 h-14 items-center justify-center"
          >
            <Feather
              name="box"
              size={22}
              color={activeTab === 'catalog' ? '#140c09' : '#4e4542'}
            />
            <Text
              className={`text-[11px] mt-0.5 ${
                activeTab === 'catalog' ? 'font-bold text-[#140c09]' : 'text-[#4e4542]'
              }`}
            >
              Catalog
            </Text>
          </TouchableOpacity>

          {/* Orders tab (Active) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('orders')}
            className="relative w-16 h-14 items-center justify-center"
          >
            <View className="relative items-center justify-center">
              <Feather
                name="package"
                size={22}
                color={activeTab === 'orders' ? '#725b38' : '#4e4542'}
              />
              {pendingCount > 0 && (
                <View className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#725b38] items-center justify-center">
                  <Text className="text-white text-[9px] font-bold">
                    {pendingCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`text-[11px] mt-0.5 ${
                activeTab === 'orders'
                  ? 'font-bold text-[#725b38]'
                  : 'text-[#4e4542]'
              }`}
            >
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('profile')}
            className="w-16 h-14 items-center justify-center"
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={activeTab === 'profile' ? '#140c09' : '#4e4542'}
            />
            <Text
              className={`text-[11px] mt-0.5 ${
                activeTab === 'profile' ? 'font-bold text-[#140c09]' : 'text-[#4e4542]'
              }`}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FLOATING AUDIO / FEEDBACK TOAST */}
      {toastMessage && (
        <View className="absolute top-4 self-center bg-[#2b211e] px-4 py-2.5 rounded-full shadow-lg flex-row items-center space-x-2 z-50">
          <Ionicons name="checkmark-circle" size={18} color="#25D366" />
          <Text className="text-white text-[12px] font-semibold">
            {toastMessage}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrdersScreenReactNative;
