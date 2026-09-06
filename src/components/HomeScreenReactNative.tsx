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
  Modal,
  Switch,
} from 'react-native';
import {
  MaterialIcons,
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

export interface ProductItem {
  id: string;
  title: string;
  category: string;
  price: string;
  quantity: string;
  status: 'live' | 'draft' | 'sold_out';
  imageUrl: string;
  isOndcListed?: boolean;
}

export interface HomeScreenProps {
  navigation?: any;
}

export const HomeScreenReactNative: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'orders' | 'profile'>('catalog');
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'draft' | 'sold_out'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [isOndcEnabled, setIsOndcEnabled] = useState<boolean>(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Initial products data matching catalogue.html
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: '1',
      title: 'Handwoven Silk Saree',
      category: 'Textiles',
      price: '₹1,200',
      quantity: 'Qty: 4',
      status: 'live',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB-sNNPD7NjjGMS1v2tbVl4yFv8Iu1JhWlZUSvVBfDKp5ZF6QhcVD2Sj6bZWaiqixmiP37vRBG3SX9F3b4uR1n5MGGkrup-cALXMHLo3q5mJKxvO6Nb25E-D5gbpBwccFakVyyk-_RDpwytaljJ-QALr2nS-n5AudvitRZYoapt2ZvvelTIOPpiqcpPk-naPoAd76t5OvZDzT6uu5VR1pT5VNtpORRdvDWNlvYgSEdonfXI4gmBrbBJ',
      isOndcListed: true,
    },
    {
      id: '2',
      title: 'Handcrafted Terracotta Vase',
      category: 'Ceramics',
      price: '₹450',
      quantity: 'Qty: 8',
      status: 'live',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD8gEkbmMy61lt8HNipaEyZvDF0R6p-ND7qw2cjEn5TZ1I4aNy53nnPEyP6HiXzAHRgdm_ed09vPoCnl1sL8dhIZLrqPDv4KXmty4ipc14XLjBMFnBDpRj8Tp826kW8qSIVv90XEcFniXGnN--UJKkOv6Z1BwWZ2wbgGT3jt2qtrJbDQFLBGha72GH9OeMBzvmZduyd2xRG_j1AtZWd8ofVb3w5hKebi8HhvGosoQnjAelg213v4nsH',
      isOndcListed: true,
    },
    {
      id: '3',
      title: 'Embroidered Jute Tote Bag',
      category: 'Accessories',
      price: '₹350',
      quantity: 'Pending',
      status: 'draft',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDukLnU4bbCJbOZFDn_6jsPBmdqKn0r3eCL6M7LKio3tU9vVx7laPhV7YMS0u2u3VEnhOvQFoarfhdEr44HF8cu5Ue78dPL4VecZWcWMZ4ZBUY7Ij25ZyVmRw1QUp8SXgDKWGXmI6Ga7PA9Muw9XeiCxNmHUMQbM6tR8xumpfSzCnLCXtuTl-6yJILr8hkIhG7rVFe8bo3rRjFirA6FjylAkc-cadJG7GgQavy9VRWMS_LHqQees_0A',
      isOndcListed: false,
    },
    {
      id: '4',
      title: 'Brass Hanging Temple Diya',
      category: 'Metalcraft',
      price: '₹890',
      quantity: '0 In Stock',
      status: 'sold_out',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDlHfIaGDyYI0EAvbGgSI27CpGX-wwPKR744QBj2N5mF8JiWx2pJEHOznBx3d-QTMJ7vwL8abVP2GDeWgoqjrZOXB6G9WbSDMfbSWGXlLSiZU1Q-PDh11pL5VbO-WmzFvbUxJPftFGSV8ArB3R772RiFxmCm1-nwf-qg8p7Fc1-jem9M8p3KpuoF4kRmPSpWYOw_XkuS_4kMmzYH_Lr1CqJ72xPS8g2gMw4SDBvOS-AIa9mLyHIicHJ',
      isOndcListed: false,
    },
    {
      id: '5',
      title: 'Block-print Cotton Kurta',
      category: 'Apparel',
      price: '₹650',
      quantity: 'Qty: 12',
      status: 'live',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCxOJ0FKTYbbuMdGP2TFkBovi83nJiUcJ9esAv6gvCjf8DY5gmmeeF-yPcG4I1EsSm76xXiCiLZNUCaGj_X0VefIt-9VDN_Hc4hPgKA2A10j92yfkmqMbhWlxTaX89BIeLseNRlL641YrAhqjzPPC8uHDFOBQcCZFL6W7c-LlEicZC4u5RWq6tWpsRptguCMiGZb517GyYZIP2HSkZP4dhUo8p-USLXe6Qn-iKKHY8lcxO3RCq5S1PX',
      isOndcListed: true,
    },
    {
      id: '6',
      title: 'Carved Sheesham Wood Box',
      category: 'Woodcraft',
      price: '₹550',
      quantity: 'Qty: 6',
      status: 'live',
      imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCp1cvKGoksKi4GTU_zeqkUAQyN_YdiyEV1hiX72ms9PeoKrT3-utw_vtH95S1WqbmkU3G_2jmzW7jFU0sl-ywaXtYbKHF1W9FtgYm5rFNQ5JJT8nE5E-XxN50l4NeudtXowIgi6i0VdgvVivkWC5-FVyY_tbEOuNG3pwcf1Y7wlWRjMVepn3Ul5174sdJyUHdoWXNcrvaVnU57nZN7wnn-4Py6PNboZs8tl2q0BEWf8C-eiRJ-pX80',
      isOndcListed: true,
    },
  ]);

  const toggleLanguage = () => {
    if (lang === 'en') {
      setLang('hi');
      Alert.alert('भाषा बदली (Language Switch)', 'भाषा बदलकर हिंदी कर दी गई है (Hindi)');
    } else {
      setLang('en');
      Alert.alert('Language Switch', 'Language switched to English');
    }
  };

  const handleOpenActionMenu = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsOndcEnabled(!!product.isOndcListed);
    setIsActionModalOpen(true);
  };

  const handleShareToWhatsApp = () => {
    if (!selectedProduct) return;
    Alert.alert(
      'WhatsApp Share',
      `Sharing "${selectedProduct.title}" (${selectedProduct.price}) directly to WhatsApp customers!`
    );
  };

  const handleToggleOndc = (value: boolean) => {
    setIsOndcEnabled(value);
    if (selectedProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, isOndcListed: value } : p))
      );
    }
    Alert.alert(
      'ONDC Network',
      value
        ? `"${selectedProduct?.title}" is now listed on Govt. ONDC Network.`
        : `Unlisted from ONDC Network.`
    );
  };

  const filteredProducts = products.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.status === activeFilter;
    const matchesCategory =
      selectedCategoryFilter === 'All' || item.category === selectedCategoryFilter;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#fdf9f3]">
      <StatusBar barStyle="dark-content" />

      {/* TOP FIXED HEADER (pt-safe, 48px+ touch targets) */}
      <View className="h-16 px-4 flex-row items-center justify-between bg-[#fdf9f3]/95 border-b border-[#ebe8e2] z-40">
        {/* Brand & Section with 48px tap target */}
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert('Catalog Home', 'Artisan Catalog Home')}
            className="w-12 h-12 items-center justify-center rounded-full bg-transparent active:scale-95"
          >
            <MaterialCommunityIcons name="token" size={26} color="#9c441c" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#180f0a] tracking-tight">
            {lang === 'en' ? 'Catalog' : 'कैटलॉग'}
          </Text>
          <View className="flex-row items-center space-x-1 bg-[#f1ede7] px-2 py-0.5 rounded-full">
            <MaterialIcons name="cloud-done" size={14} color="#047857" />
            <Text className="text-[11px] font-medium text-[#4e4540]">Saved Offline</Text>
          </View>
        </View>

        {/* Action targets: Language Switcher, Notifications, Profile (all >= 48x48px) */}
        <View className="flex-row items-center space-x-1">
          {/* Language Switcher Pill Button (48px tap height) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleLanguage}
            className="h-12 px-3.5 rounded-full bg-[#f1ede7] border border-[#d1c4bd]/40 flex-row items-center space-x-1.5 shadow-xs active:scale-95"
          >
            <MaterialIcons name="translate" size={18} color="#9c441c" />
            <Text className="font-bold text-sm text-[#180f0a] tracking-wide">
              {lang === 'en' ? 'A / अ' : 'अ / A'}
            </Text>
          </TouchableOpacity>

          {/* Notification Bell (48x48px) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert('Notifications', 'You have no unread store notifications.')}
            className="w-12 h-12 items-center justify-center rounded-full active:scale-95 relative"
          >
            <Ionicons name="notifications-outline" size={24} color="#4e4540" />
            <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#9c441c]" />
          </TouchableOpacity>

          {/* Profile Avatar (48x48px tap target) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert('Artisan Profile', 'Opening Shop Profile')}
            className="w-12 h-12 items-center justify-center rounded-full active:scale-95"
          >
            <View className="w-9 h-9 rounded-full bg-[#180f0a] items-center justify-center shadow-xs">
              <Feather name="user" size={18} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        className="flex-1 bg-[#fdf9f3]"
      >
        {/* SUB-HEADER SHOP INFO & ADD PRODUCT CTA */}
        <View className="px-4 pt-3 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs font-bold text-[#9c441c] tracking-wider uppercase mb-0.5">
                My Shop
              </Text>
              <View className="flex-row items-center space-x-2">
                <Text className="text-xl font-bold text-[#180f0a] tracking-tight">
                  My Shop Inventory
                </Text>
                <View className="px-2.5 py-0.5 bg-[#ffdbce] rounded-full">
                  <Text className="text-xs font-bold text-[#370e00]">
                    {products.length} Items
                  </Text>
                </View>
              </View>
            </View>

            {/* Large 48px height Add Product Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Alert.alert('Add Product', 'Opening AI Studio Camera & Voice Cataloger...')}
              className="h-12 px-5 rounded-full bg-[#180f0a] flex-row items-center space-x-2 shadow-md active:scale-95"
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text className="text-sm font-bold text-white">Add Product</Text>
            </TouchableOpacity>
          </View>

          {/* QUICK STOCK HEALTH GAUGE STRIP */}
          <View className="bg-[#f7f3ed] border border-[#f1ede7] rounded-2xl p-3.5 mb-3 shadow-xs">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-[#4e4540]">Stock Availability</Text>
              <Text className="text-xs font-bold text-[#180f0a]">83% Active</Text>
            </View>

            {/* Stacked Progress Bar */}
            <View className="w-full h-2 bg-[#e6e2dc] rounded-full overflow-hidden flex-row">
              <View className="bg-[#047857] h-full w-[67%]" />
              <View className="bg-[#d97706] h-full w-[17%]" />
              <View className="bg-[#ba1a1a] h-full w-[16%]" />
            </View>

            <View className="flex-row items-center justify-between text-xs font-semibold text-[#4e4540] mt-2.5">
              <View className="flex-row items-center space-x-1.5">
                <View className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
                <Text className="text-xs font-medium text-[#4e4540]">8 Live</Text>
              </View>

              <View className="flex-row items-center space-x-1.5">
                <View className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                <Text className="text-xs font-medium text-[#4e4540]">2 In Review</Text>
              </View>

              <View className="flex-row items-center space-x-1.5">
                <View className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
                <Text className="text-xs font-medium text-[#4e4540]">2 Sold Out</Text>
              </View>
            </View>
          </View>

          {/* SEARCH & FILTER BAR (48px height targets) */}
          <View className="flex-row items-center space-x-2 mb-3">
            <View className="flex-1 relative flex-row items-center">
              <Feather
                name="search"
                size={20}
                color="#4e4540"
                style={{ position: 'absolute', left: 14, zIndex: 1 }}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search products in my shop..."
                placeholderTextColor="#4e4540"
                className="w-full h-12 pl-11 pr-12 bg-white text-[#180f0a] text-sm font-medium rounded-2xl shadow-xs border border-[#ebe8e2]"
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Alert.alert('Voice Search', 'Listening for voice search...')}
                className="absolute right-1.5 w-9 h-9 rounded-xl items-center justify-center active:scale-90"
              >
                <Feather name="mic" size={18} color="#9c441c" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsFilterSheetOpen(true)}
              className="w-12 h-12 rounded-2xl bg-white border border-[#ebe8e2] items-center justify-center shadow-xs active:scale-95 relative"
            >
              <Ionicons name="options-outline" size={22} color="#4e4540" />
              <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#9c441c]" />
            </TouchableOpacity>
          </View>

          {/* FILTER CHIPS HORIZONTAL SCROLL (44px+ height) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row space-x-2 pb-1"
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveFilter('all')}
              className={`h-11 px-4 rounded-full justify-center items-center shadow-xs ${
                activeFilter === 'all'
                  ? 'bg-[#180f0a]'
                  : 'bg-white border border-[#ebe8e2]'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  activeFilter === 'all' ? 'text-white' : 'text-[#4e4540]'
                }`}
              >
                All ({products.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveFilter('live')}
              className={`h-11 px-4 rounded-full flex-row items-center space-x-2 shadow-xs ${
                activeFilter === 'live'
                  ? 'bg-[#180f0a]'
                  : 'bg-white border border-[#ebe8e2]'
              }`}
            >
              <View className="w-2.5 h-2.5 rounded-full bg-[#047857]" />
              <Text
                className={`text-xs font-bold ${
                  activeFilter === 'live' ? 'text-white' : 'text-[#4e4540]'
                }`}
              >
                🟢 Live (4)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveFilter('draft')}
              className={`h-11 px-4 rounded-full flex-row items-center space-x-2 shadow-xs ${
                activeFilter === 'draft'
                  ? 'bg-[#180f0a]'
                  : 'bg-white border border-[#ebe8e2]'
              }`}
            >
              <View className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
              <Text
                className={`text-xs font-bold ${
                  activeFilter === 'draft' ? 'text-white' : 'text-[#4e4540]'
                }`}
              >
                🟡 In Review (1)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveFilter('sold_out')}
              className={`h-11 px-4 rounded-full flex-row items-center space-x-2 shadow-xs ${
                activeFilter === 'sold_out'
                  ? 'bg-[#180f0a]'
                  : 'bg-white border border-[#ebe8e2]'
              }`}
            >
              <View className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a]" />
              <Text
                className={`text-xs font-bold ${
                  activeFilter === 'sold_out' ? 'text-white' : 'text-[#4e4540]'
                }`}
              >
                🔴 Sold Out (1)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 2-COLUMN PRODUCT GRID */}
        <View className="px-4 pt-1 pb-4">
          <View className="flex-row flex-wrap justify-between">
            {filteredProducts.map((item) => (
              <View
                key={item.id}
                className="w-[48%] bg-white rounded-2xl p-2 border border-[#f1ede7] shadow-xs mb-3 flex-col justify-between"
              >
                <View className="relative aspect-[4/5] w-full rounded-xl overflow-hidden bg-[#f7f3ed]">
                  <Image
                    source={{ uri: item.imageUrl }}
                    className={`w-full h-full object-cover ${
                      item.status === 'sold_out' ? 'opacity-75' : 'opacity-100'
                    }`}
                  />

                  {/* Status Badge */}
                  <View className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md flex-row items-center space-x-1.5 shadow-sm">
                    <View
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'live'
                          ? 'bg-[#047857]'
                          : item.status === 'draft'
                          ? 'bg-[#d97706]'
                          : 'bg-[#ba1a1a]'
                      }`}
                    />
                    <Text
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        item.status === 'sold_out' ? 'text-[#ba1a1a]' : 'text-[#180f0a]'
                      }`}
                    >
                      {item.status === 'live'
                        ? 'Live'
                        : item.status === 'draft'
                        ? 'In Review'
                        : 'Sold Out'}
                    </Text>
                  </View>

                  {/* 48x48px 3-dots Option Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleOpenActionMenu(item)}
                    className="absolute top-1.5 right-1.5 w-12 h-12 rounded-full bg-white/90 items-center justify-center shadow-md active:scale-90 z-10"
                  >
                    <MaterialIcons name="more-vert" size={24} color="#180f0a" />
                  </TouchableOpacity>
                </View>

                <View className="flex-col flex-1 px-1 pt-2 pb-1">
                  <Text
                    className="text-[11px] font-bold uppercase text-[#9c441c] tracking-wider mb-0.5"
                    numberOfLines={1}
                  >
                    {item.category}
                  </Text>
                  <Text className="text-sm font-bold text-[#180f0a] mb-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View className="mt-auto flex-row items-center justify-between pt-1">
                    <Text className="text-base font-extrabold text-[#180f0a]">✨ {item.price}</Text>
                    <Text
                      className={`text-xs font-semibold ${
                        item.status === 'sold_out'
                          ? 'text-[#ba1a1a] font-bold'
                          : item.status === 'draft'
                          ? 'text-[#b45309] font-bold'
                          : 'text-[#4e4540]'
                      }`}
                    >
                      {item.quantity}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* EMPTY STATE */}
          {filteredProducts.length === 0 && (
            <View className="items-center justify-center py-12 px-4 text-center">
              <View className="w-16 h-16 rounded-full bg-[#f1ede7] items-center justify-center text-[#9c441c] mb-3">
                <MaterialCommunityIcons name="package-variant-closed" size={32} color="#9c441c" />
              </View>
              <Text className="text-lg font-bold text-[#180f0a] mb-1">No Crafts Discovered</Text>
              <Text className="text-sm text-[#4e4540] text-center mb-4">
                We couldn't locate items matching your query. Clear search or check your filters.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setSelectedCategoryFilter('All');
                }}
                className="h-12 px-6 rounded-full bg-[#180f0a] justify-center items-center shadow-sm active:scale-95"
              >
                <Text className="text-sm font-bold text-white">Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* MY SHOP RESTOCK NOTIFICATION BANNER */}
          <View className="mt-4 p-4 bg-[#f7f3ed] border border-[#f1ede7] rounded-2xl shadow-xs flex-row items-center justify-between">
            <View className="flex-row items-center space-x-3 flex-1">
              <View className="w-10 h-10 rounded-full bg-[#9c441c]/10 items-center justify-center">
                <MaterialIcons name="sync-saved-locally" size={22} color="#9c441c" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#180f0a]">
                  Instant Restock Notification
                </Text>
                <Text className="text-xs text-[#4e4540] mt-0.5">
                  2 products require urgent replenishment in My Shop
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('Restock Details', 'Opening restock suggestions')}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-xs active:scale-95"
            >
              <Feather name="chevron-right" size={20} color="#180f0a" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* PRODUCT OPTIONS ACTION BOTTOM SHEET MODAL */}
      <Modal
        visible={isActionModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsActionModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsActionModalOpen(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e: any) => e?.stopPropagation?.()}
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl border-t border-[#ebe8e2] self-center"
          >
            {/* Grab Bar */}
            <View className="w-12 h-1.5 bg-[#d1c4bd]/60 rounded-full align-self-center mx-auto mb-4" />

            {/* Selected Product Mini Header Card */}
            {selectedProduct && (
              <View className="flex-row items-center space-x-3 p-3 bg-[#f7f3ed] rounded-2xl mb-4 border border-[#f1ede7]">
                <Image
                  source={{ uri: selectedProduct.imageUrl }}
                  className="w-14 h-14 rounded-xl object-cover shadow-xs"
                />
                <View className="flex-1">
                  <View className="flex-row items-center space-x-2 mb-0.5">
                    <Text className="text-[10px] font-bold text-[#9c441c] uppercase tracking-wider">
                      {selectedProduct.category}
                    </Text>
                    <View className="px-2 py-0.5 rounded-full bg-white">
                      <Text className="text-[10px] font-bold text-[#047857]">
                        {selectedProduct.status === 'live'
                          ? '🟢 LIVE'
                          : selectedProduct.status === 'draft'
                          ? '🟡 IN REVIEW'
                          : '🔴 SOLD OUT'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-base font-bold text-[#180f0a]" numberOfLines={1}>
                    {selectedProduct.title}
                  </Text>
                  <Text className="text-sm font-extrabold text-[#180f0a]">
                    {selectedProduct.price}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsActionModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-[#f1ede7] items-center justify-center active:scale-95"
                >
                  <Ionicons name="close" size={20} color="#4e4540" />
                </TouchableOpacity>
              </View>
            )}

            {/* Prominent WhatsApp Share Button (#25D366, min 48px target) */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShareToWhatsApp}
              className="w-full h-[52px] px-4 rounded-2xl bg-[#25D366] flex-row items-center justify-center space-x-3 shadow-sm active:scale-98 mb-3"
            >
              <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
              <Text className="text-white font-bold text-base">Share to WhatsApp</Text>
            </TouchableOpacity>

            {/* ONDC Network Integration Row with Switch */}
            <View className="flex-row items-center justify-between p-3.5 bg-[#f7f3ed] rounded-2xl mb-3 border border-[#f1ede7]">
              <View className="flex-row items-center space-x-3 flex-1 pr-2">
                <View className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 items-center justify-center">
                  <Text className="text-[10px] font-extrabold text-blue-700 tracking-tighter">
                    ONDC
                  </Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center space-x-1.5">
                    <Text className="text-sm font-bold text-[#180f0a]">List on ONDC Network</Text>
                    <View className="bg-blue-100 px-1.5 py-0.5 rounded">
                      <Text className="text-blue-800 text-[10px] font-bold">Govt.</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-[#4e4540] font-normal">
                    Enable buyers across India via open commerce
                  </Text>
                </View>
              </View>

              <Switch
                value={isOndcEnabled}
                onValueChange={handleToggleOndc}
                trackColor={{ false: '#d1c4bd', true: '#059669' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Action List */}
            <View className="flex-col space-y-1.5">
              {/* Edit Product Details */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsActionModalOpen(false);
                  if (navigation?.navigate) {
                    navigation.navigate('Review');
                  } else {
                    Alert.alert('Edit Product', `Editing ${selectedProduct?.title}`);
                  }
                }}
                className="h-12 flex-row items-center space-x-3 px-3.5 rounded-xl text-left"
              >
                <View className="w-8 h-8 rounded-full bg-[#f1ede7] items-center justify-center">
                  <Feather name="edit" size={18} color="#9c441c" />
                </View>
                <Text className="flex-1 font-bold text-sm text-[#180f0a]">Edit Product Details</Text>
                <Feather name="chevron-right" size={20} color="#4e4540" />
              </TouchableOpacity>

              {/* Adjust Stock Inventory */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsActionModalOpen(false);
                  Alert.alert('Adjust Stock', `Stock count adjusted for ${selectedProduct?.title}`);
                }}
                className="h-12 flex-row items-center space-x-3 px-3.5 rounded-xl text-left"
              >
                <View className="w-8 h-8 rounded-full bg-[#f1ede7] items-center justify-center">
                  <Feather name="box" size={18} color="#9c441c" />
                </View>
                <Text className="flex-1 font-bold text-sm text-[#180f0a]">Adjust Stock Count</Text>
                <Feather name="chevron-right" size={20} color="#4e4540" />
              </TouchableOpacity>

              {/* Hide Product */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsActionModalOpen(false);
                  Alert.alert('Hide Product', `${selectedProduct?.title} hidden from buyers`);
                }}
                className="h-12 flex-row items-center space-x-3 px-3.5 rounded-xl text-left"
              >
                <View className="w-8 h-8 rounded-full bg-[#f1ede7] items-center justify-center">
                  <Feather name="eye-off" size={18} color="#4e4540" />
                </View>
                <Text className="flex-1 font-bold text-sm text-[#4e4540]">Hide Product</Text>
                <Text className="text-xs text-[#4e4540] font-medium">Temporarily unpublish</Text>
              </TouchableOpacity>

              {/* Delete Product */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (selectedProduct) {
                    setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
                  }
                  setIsActionModalOpen(false);
                  Alert.alert('Deleted', 'Item removed from catalog');
                }}
                className="h-12 flex-row items-center space-x-3 px-3.5 rounded-xl text-left"
              >
                <View className="w-8 h-8 rounded-full bg-[#ffdad6] items-center justify-center">
                  <Feather name="trash-2" size={18} color="#ba1a1a" />
                </View>
                <Text className="flex-1 font-bold text-sm text-[#ba1a1a]">Delete Product</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* FILTER & SORT MODAL SHEET */}
      <Modal
        visible={isFilterSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterSheetOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsFilterSheetOpen(false)}
          className="flex-1 bg-black/40 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e: any) => e?.stopPropagation?.()}
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 shadow-2xl border-t border-[#ebe8e2] self-center"
          >
            <View className="w-12 h-1.5 bg-[#d1c4bd]/60 rounded-full mx-auto mb-4" />
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-[#180f0a]">Filter Crafts</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsFilterSheetOpen(false)}
                className="w-10 h-10 rounded-full bg-[#f1ede7] items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#4e4540" />
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#9c441c] mb-2">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {['All', 'Textiles', 'Ceramics', 'Metalcraft', 'Woodcraft', 'Apparel'].map(
                  (cat) => (
                    <TouchableOpacity
                      key={cat}
                      activeOpacity={0.8}
                      onPress={() => setSelectedCategoryFilter(cat)}
                      className={`h-10 px-4 rounded-full justify-center items-center ${
                        selectedCategoryFilter === cat
                          ? 'bg-[#180f0a]'
                          : 'bg-[#f1ede7]'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedCategoryFilter === cat ? 'text-white' : 'text-[#4e4540]'
                        }`}
                      >
                        {cat === 'All' ? 'All Categories' : cat}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {/* Sort by Price */}
            <View className="mb-6">
              <Text className="text-xs font-bold uppercase tracking-wider text-[#9c441c] mb-2">
                Sort by Price
              </Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setProducts((prev) =>
                      [...prev].sort(
                        (a, b) =>
                          parseInt(a.price.replace(/[^\d]/g, '')) -
                          parseInt(b.price.replace(/[^\d]/g, ''))
                      )
                    )
                  }
                  className="flex-1 h-12 px-4 rounded-xl bg-[#f1ede7] flex-row items-center justify-center space-x-2 active:scale-98"
                >
                  <Feather name="arrow-up" size={18} color="#180f0a" />
                  <Text className="text-xs font-bold text-[#180f0a]">Low to High</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    setProducts((prev) =>
                      [...prev].sort(
                        (a, b) =>
                          parseInt(b.price.replace(/[^\d]/g, '')) -
                          parseInt(a.price.replace(/[^\d]/g, ''))
                      )
                    )
                  }
                  className="flex-1 h-12 px-4 rounded-xl bg-[#f1ede7] flex-row items-center justify-center space-x-2 active:scale-98"
                >
                  <Feather name="arrow-down" size={18} color="#180f0a" />
                  <Text className="text-xs font-bold text-[#180f0a]">High to Low</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row space-x-2.5">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedCategoryFilter('All');
                  setIsFilterSheetOpen(false);
                }}
                className="flex-1 h-12 rounded-xl bg-[#f1ede7] items-center justify-center active:scale-98"
              >
                <Text className="text-sm font-bold text-[#180f0a]">Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsFilterSheetOpen(false)}
                className="flex-1 h-12 rounded-xl bg-[#180f0a] items-center justify-center shadow-sm active:scale-98"
              >
                <Text className="text-sm font-bold text-white">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* FLOATING ACTION BUTTON (Add Product -> navigates full-screen to Capture) */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          if (navigation?.navigate) {
            navigation.navigate('Capture');
          } else {
            Alert.alert('Capture Studio', 'Opening AI Camera Viewfinder...');
          }
        }}
        style={{
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        }}
        className={`absolute ${
          navigation ? 'bottom-6' : 'bottom-24'
        } right-5 min-h-[52px] px-5 rounded-full bg-[#180f0a] flex-row items-center justify-center space-x-2.5 z-50 active:scale-95`}
      >
        <Feather name="camera" size={20} color="#ffffff" />
        <Text className="text-white font-bold text-[14px] tracking-wide">
          Add Product
        </Text>
        <Text className="text-[#fedeb2] text-[12px] font-medium">
          (नया शिल्प)
        </Text>
      </TouchableOpacity>

      {/* STANDALONE FALLBACK BOTTOM NAVIGATION BAR (only rendered if outside React Navigation) */}
      {!navigation && (
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-[#fdf9f3]/95 border-t border-[#ebe8e2] flex-row items-center justify-around z-40">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('home')}
            className="items-center justify-center min-w-[54px] min-h-[48px] py-1"
          >
            <MaterialCommunityIcons
              name="home-variant-outline"
              size={24}
              color={activeTab === 'home' ? '#180f0a' : '#4e4540'}
            />
            <Text
              className={`text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'home' ? 'font-bold text-[#180f0a]' : 'font-medium text-[#4e4540]'
              }`}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('catalog')}
            className="items-center justify-center min-w-[54px] min-h-[48px] py-1"
          >
            <Feather
              name="box"
              size={24}
              color={activeTab === 'catalog' ? '#180f0a' : '#4e4540'}
            />
            <Text
              className={`text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'catalog' ? 'font-bold text-[#180f0a]' : 'font-medium text-[#4e4540]'
              }`}
            >
              Catalog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('orders')}
            className="items-center justify-center min-w-[54px] min-h-[48px] py-1"
          >
            <Ionicons
              name="receipt-outline"
              size={24}
              color={activeTab === 'orders' ? '#180f0a' : '#4e4540'}
            />
            <Text
              className={`text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'orders' ? 'font-bold text-[#180f0a]' : 'font-medium text-[#4e4540]'
              }`}
            >
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('profile')}
            className="items-center justify-center min-w-[54px] min-h-[48px] py-1"
          >
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={activeTab === 'profile' ? '#180f0a' : '#4e4540'}
            />
            <Text
              className={`text-[11px] tracking-tight mt-0.5 ${
                activeTab === 'profile' ? 'font-bold text-[#180f0a]' : 'font-medium text-[#4e4540]'
              }`}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default HomeScreenReactNative;
