import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show File;
import '../category_service.dart';
import '../job_service.dart';
import '../../../shared/screens/map_picker_screen.dart';
import '../../../core/services/location_service.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class PostJobScreen extends StatefulWidget {
  const PostJobScreen({super.key});

  @override
  State<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _budgetController = TextEditingController();
  final _locationController = TextEditingController();
  int? _selectedCategoryId;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  List<XFile> _images = [];
  LatLng? _selectedLocationData;
  final LocationService _locationService = LocationService();
  bool _isLoading = false;
  bool _isNegotiable = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImages() async {
    final List<XFile> pickedImages = await _picker.pickMultiImage();
    if (pickedImages.isNotEmpty) {
      setState(() {
        _images.addAll(pickedImages);
      });
    }
  }

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
    });
  }

  void _submit() async {
    if (!_formKey.currentState!.validate() || _selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }

    setState(() => _isLoading = true);
    final success = await context.read<JobService>().createJob({
      'title': _titleController.text,
      'description': _descController.text,
      'category_id': _selectedCategoryId,
      'budget': double.parse(_budgetController.text),
      'location': _locationController.text,
      'latitude': _selectedLocationData?.latitude,
      'longitude': _selectedLocationData?.longitude,
      'preferred_date': _selectedDate != null ? DateFormat('yyyy-MM-dd').format(_selectedDate!) : null,
      'preferred_time': _selectedTime != null ? '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}' : null,
      'is_negotiable': _isNegotiable,
    }, _images);
    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job posted successfully!')));
        Navigator.pop(context);
      }
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) setState(() => _selectedTime = picked);
  }

  Future<void> _pickLocationOnMap() async {
    final LatLng? result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapPickerScreen(initialLocation: _selectedLocationData),
      ),
    );

    if (result != null) {
      setState(() => _selectedLocationData = result);
      // Try to get address
      final address = await _locationService.getAddressFromLatLng(result.latitude, result.longitude);
      if (address != null) {
        _locationController.text = address;
      }
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLoading = true);
    try {
      final pos = await _locationService.getCurrentLocation();
      if (pos != null) {
        final latLng = LatLng(pos.latitude, pos.longitude);
        setState(() => _selectedLocationData = latLng);
        final address = await _locationService.getAddressFromLatLng(pos.latitude, pos.longitude);
        if (address != null) {
          _locationController.text = address;
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<CategoryService>().categories;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Post a Job',
          style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Color(0xFF1E293B)),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader('Job Title *'),
                    _buildTextField(_titleController, 'e.g., Fix Kitchen Sink Leak'),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Description *'),
                    _buildTextField(_descController, 'Describe your job in detail...', maxLines: 5),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Category *'),
                    _buildDropdownField(categories),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Budget (USD) *'),
                    _buildTextField(_budgetController, 'Enter your budget', isNumber: true, prefix: const Icon(Icons.attach_money, size: 20, color: Color(0xFF94A3B8))),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Budget is Negotiable', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF475569))),
                      value: _isNegotiable,
                      activeColor: const Color(0xFF6366F1),
                      onChanged: (v) => setState(() => _isNegotiable = v),
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Location *'),
                    _buildTextField(
                      _locationController, 
                      'Enter or pick location', 
                      prefix: const Icon(Icons.location_on_outlined, size: 20, color: Color(0xFF6366F1)),
                      readOnly: true,
                      onTap: _pickLocationOnMap,
                      suffix: IconButton(
                        icon: const Icon(Icons.my_location, color: Color(0xFF6366F1), size: 20),
                        onPressed: _useCurrentLocation,
                        tooltip: 'Use current location',
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader('Preferred Date'),
                              _buildPickerField(
                                _selectedDate == null ? 'mm/dd/yyyy' : DateFormat('MM/dd/yyyy').format(_selectedDate!),
                                Icons.calendar_today_outlined,
                                _pickDate,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader('Preferred Time'),
                              _buildPickerField(
                                _selectedTime == null ? '--:-- --' : _selectedTime!.format(context),
                                Icons.access_time,
                                _pickTime,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Images (Optional)'),
                    _buildImageUpload(),
                    const SizedBox(height: 32),
                    _buildTipsCard(),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1, bool isNumber = false, Widget? prefix, Widget? suffix, bool readOnly = false, VoidCallback? onTap}) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      readOnly: readOnly,
      onTap: onTap,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: prefix,
        suffixIcon: suffix,
      ),
      validator: (v) => v!.isEmpty ? 'Field required' : null,
    );
  }

  Widget _buildDropdownField(List<dynamic> categories) {
    return DropdownButtonFormField<int>(
      value: _selectedCategoryId,
      decoration: const InputDecoration(hintText: 'Select a category'),
      items: categories.map<DropdownMenuItem<int>>((cat) {
        return DropdownMenuItem<int>(value: cat['id'], child: Text(cat['name']));
      }).toList(),
      onChanged: (v) => setState(() => _selectedCategoryId = v),
      validator: (v) => v == null ? 'Please select a category' : null,
    );
  }

  Widget _buildPickerField(String value, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF94A3B8)),
            const SizedBox(width: 12),
            Text(value, style: TextStyle(color: value.contains('/') || value.contains(':') ? const Color(0xFF1E293B) : const Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }

  Widget _buildImageUpload() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_images.isNotEmpty)
          Container(
            height: 120,
            margin: const EdgeInsets.only(bottom: 16),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _images.length,
              itemBuilder: (context, index) {
                return Stack(
                  children: [
                    Container(
                      width: 120,
                      margin: const EdgeInsets.only(right: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        image: DecorationImage(
                          image: kIsWeb 
                            ? NetworkImage(_images[index].path) 
                            : FileImage(File(_images[index].path)) as ImageProvider,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 4,
                      right: 16,
                      child: GestureDetector(
                        onTap: () => _removeImage(index),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 16, color: Colors.red),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        InkWell(
          onTap: _images.length >= 6 ? null : _pickImages,
          child: Container(
            width: double.infinity,
            height: 100,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_photo_alternate_outlined, color: _images.length >= 6 ? Colors.grey : const Color(0xFF6366F1), size: 32),
                const SizedBox(height: 8),
                Text(
                  _images.length >= 6 ? 'Maximum 6 images reached' : 'Add Project Images',
                  style: TextStyle(color: _images.length >= 6 ? Colors.grey : const Color(0xFF64748B), fontSize: 13, fontWeight: FontWeight.w500),
                ),
                Text('(${_images.length}/6 items)', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTipsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF0F9FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBAE6FD)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(color: Color(0xFFE0F2FE), shape: BoxShape.circle),
            child: const Icon(Icons.lightbulb_outline, color: Color(0xFF0EA5E9), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Tips for better responses', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0C4A6E))),
                SizedBox(height: 8),
                Text('• Be specific about your requirements', style: TextStyle(fontSize: 12, color: Color(0xFF0C4A6E))),
                Text('• Include relevant photos if possible', style: TextStyle(fontSize: 12, color: Color(0xFF0C4A6E))),
                Text('• Set a realistic budget', style: TextStyle(fontSize: 12, color: Color(0xFF0C4A6E))),
                Text('• Mention your preferred timeline', style: TextStyle(fontSize: 12, color: Color(0xFF0C4A6E))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -4)),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
              child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Post Job'),
            ),
          ),
        ],
      ),
    );
  }
}
