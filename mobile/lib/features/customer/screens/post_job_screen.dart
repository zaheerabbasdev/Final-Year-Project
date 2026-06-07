import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show File;
import 'package:google_fonts/google_fonts.dart';
import '../category_service.dart';
import '../job_service.dart';
import '../../../shared/screens/map_picker_screen.dart';
import '../../../core/services/location_service.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../core/theme.dart';

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
  final List<XFile> _images = [];
  LatLng? _selectedLocationData;
  final LocationService _locationService = LocationService();
  bool _isLoading = false;
  bool _isNegotiable = false;
  bool _isEmergency = false;
  final ImagePicker _picker = ImagePicker();

  Future<void> _autocompleteDescription() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();

    String inputText = '';
    if (title.isNotEmpty) {
      inputText = title;
      if (desc.isNotEmpty && desc != title) {
        inputText = "$title - $desc";
      }
    } else {
      inputText = desc;
    }

    if (inputText.length < 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter a Job Title or description first so AI can generate details.', style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.textColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    final suggestion = await context.read<JobService>().getAutocompleteSuggestions(inputText);
    setState(() => _isLoading = false);

    if (suggestion != null) {
      setState(() {
        if (suggestion['completion'] != null && suggestion['completion'].toString().isNotEmpty) {
          _descController.text = suggestion['completion'];
        }
        
        if (suggestion['category'] != null) {
          final categories = context.read<CategoryService>().categories;
          final matchedCat = categories.firstWhere(
            (c) => c['name'].toString().toLowerCase() == suggestion['category'].toString().toLowerCase(),
            orElse: () => null,
          );
          if (matchedCat != null) {
            _selectedCategoryId = matchedCat['id'];
          }
        }
        
        if (suggestion['suggestedBudget'] != null) {
          _budgetController.text = suggestion['suggestedBudget'].toString();
        }
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('AI auto-filled details based on your input!', style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.successColor,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to generate suggestions. Please fill manually.', style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    }
  }

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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please fill all required fields', style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    final jobData = {
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
      'is_emergency': _isEmergency,
    };
    print('DEBUG: Sending Job Data: $jobData');
    final success = await context.read<JobService>().createJob(jobData, _images);
    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Job posted successfully!', style: GoogleFonts.outfit()),
            backgroundColor: AppTheme.successColor,
          ),
        );
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
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              onSurface: AppTheme.textColor,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                textStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryColor,
              onPrimary: Colors.white,
              onSurface: AppTheme.textColor,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                textStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          child: child!,
        );
      },
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
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString(), style: GoogleFonts.outfit()),
          backgroundColor: AppTheme.errorColor,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = context.watch<CategoryService>().categories;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        scrolledUnderElevation: 0,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppTheme.textColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Post a Job',
          style: GoogleFonts.outfit(color: AppTheme.textColor, fontWeight: FontWeight.bold, fontSize: 20),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader('Job Title *'),
                    _buildTextField(_titleController, 'e.g., Fix Kitchen Sink Leak'),
                    const SizedBox(height: 20),
                    _buildSectionHeader('Description *'),
                    _buildTextField(_descController, 'Describe your job in detail...', maxLines: 5),
                    const SizedBox(height: 4),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: _autocompleteDescription,
                        icon: const Icon(Icons.psychology, size: 18, color: AppTheme.secondaryColor),
                        label: Text(
                          'AI Auto-Fill Description & Category',
                          style: GoogleFonts.outfit(color: AppTheme.secondaryColor, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildSectionHeader('Category *'),
                    _buildDropdownField(categories),
                    const SizedBox(height: 20),
                    _buildSectionHeader('Budget (PKR) *'),
                    _buildTextField(
                      _budgetController,
                      'Enter your budget',
                      isNumber: true,
                      prefix: const Icon(Icons.attach_money, size: 20, color: AppTheme.subtextColor),
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        'Budget is Negotiable',
                        style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textColor),
                      ),
                      value: _isNegotiable,
                      activeColor: AppTheme.primaryColor,
                      onChanged: (v) => setState(() => _isNegotiable = v),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _isEmergency ? const Color(0xFFFEF2F2) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _isEmergency ? AppTheme.errorColor.withOpacity(0.3) : const Color(0xFFE2E8F0),
                          width: _isEmergency ? 1.5 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          SwitchListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(
                              'EMERGENCY / EXPRESS HIRE',
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.errorColor,
                                letterSpacing: 0.5,
                              ),
                            ),
                            subtitle: Text(
                              'Skip bidding. The first provider to accept will be hired immediately.',
                              style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.errorColor.withOpacity(0.8), height: 1.3),
                            ),
                            secondary: Icon(Icons.bolt, color: _isEmergency ? AppTheme.errorColor : AppTheme.subtextColor),
                            value: _isEmergency,
                            activeColor: AppTheme.errorColor,
                            onChanged: (v) => setState(() => _isEmergency = v),
                          ),
                          if (_isEmergency)
                            Container(
                              padding: const EdgeInsets.all(12),
                              margin: const EdgeInsets.only(top: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.errorColor.withOpacity(0.15)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline, size: 16, color: AppTheme.errorColor),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Bidding is skipped. First responder is hired!',
                                      style: GoogleFonts.outfit(fontSize: 12, color: AppTheme.errorColor, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildSectionHeader('Location *'),
                    _buildTextField(
                      _locationController,
                      'Enter or pick location',
                      prefix: const Icon(Icons.location_on_outlined, size: 20, color: AppTheme.primaryColor),
                      readOnly: true,
                      onTap: _pickLocationOnMap,
                      suffix: IconButton(
                        icon: const Icon(Icons.my_location, color: AppTheme.primaryColor, size: 20),
                        onPressed: _useCurrentLocation,
                        tooltip: 'Use current location',
                      ),
                    ),
                    const SizedBox(height: 20),
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
                    const SizedBox(height: 20),
                    _buildSectionHeader('Images (Optional)'),
                    _buildImageUpload(),
                    const SizedBox(height: 20),
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
        style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textColor),
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
      style: GoogleFonts.outfit(color: AppTheme.textColor, fontSize: 15),
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
      style: GoogleFonts.outfit(color: AppTheme.textColor, fontSize: 15),
      decoration: const InputDecoration(hintText: 'Select a category'),
      isExpanded: true,
      items: categories.map<DropdownMenuItem<int>>((cat) {
        return DropdownMenuItem<int>(
          value: cat['id'],
          child: Text(cat['name'], style: GoogleFonts.outfit()),
        );
      }).toList(),
      onChanged: (v) => setState(() => _selectedCategoryId = v),
      validator: (v) => v == null ? 'Please select a category' : null,
    );
  }

  Widget _buildPickerField(String value, IconData icon, VoidCallback onTap) {
    final hasVal = value.contains('/') || value.contains(':');
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppTheme.subtextColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  color: hasVal ? AppTheme.textColor : AppTheme.subtextColor,
                  fontSize: 15,
                  fontWeight: hasVal ? FontWeight.w500 : FontWeight.normal,
                ),
              ),
            ),
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
            height: 100,
            margin: const EdgeInsets.only(bottom: 16),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _images.length,
              itemBuilder: (context, index) {
                return Stack(
                  children: [
                    Container(
                      width: 100,
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
                          child: const Icon(Icons.close, size: 14, color: AppTheme.errorColor),
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
          borderRadius: BorderRadius.circular(20),
          child: Container(
            width: double.infinity,
            height: 100,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.add_photo_alternate_outlined,
                  color: _images.length >= 6 ? AppTheme.subtextColor.withOpacity(0.5) : AppTheme.primaryColor,
                  size: 28,
                ),
                const SizedBox(height: 6),
                Text(
                  _images.length >= 6 ? 'Maximum 6 images reached' : 'Add Project Images',
                  style: GoogleFonts.outfit(
                    color: _images.length >= 6 ? AppTheme.subtextColor.withOpacity(0.5) : AppTheme.textColor,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '(${_images.length}/6 items)',
                  style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontSize: 11),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: AppTheme.textColor.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Cancel',
                style: GoogleFonts.outfit(color: AppTheme.subtextColor, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                padding: const EdgeInsets.symmetric(vertical: 18),
              ),
              child: _isLoading 
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  ) 
                : Text(
                    'Post Job',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
