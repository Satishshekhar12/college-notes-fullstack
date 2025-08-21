# PowerPoint to PDF Conversion Setup

## Prerequisites

This application now automatically converts PowerPoint (.ppt, .pptx) and Word (.doc, .docx) files to PDF during upload for better browser compatibility.

### Required Software

**LibreOffice** must be installed on the server for document conversion to work.

#### Windows Installation:

1. Download LibreOffice from: https://www.libreoffice.org/download/download/
2. Run the installer with default settings
3. Ensure LibreOffice is added to system PATH

#### Linux Installation:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libreoffice

# CentOS/RHEL
sudo yum install libreoffice

# Or using snap
sudo snap install libreoffice
```

#### macOS Installation:

```bash
# Using Homebrew
brew install --cask libreoffice

# Or download from https://www.libreoffice.org/download/download/
```

### Verification

To test if LibreOffice is properly installed, run:

```bash
libreoffice --version
```

You should see output like:

```
LibreOffice 7.x.x.x
```

### Features

- **Automatic Conversion**: PowerPoint (.ppt, .pptx) and Word (.doc, .docx) files are automatically converted to PDF during upload
- **Better Compatibility**: PDF files display consistently across all browsers
- **Compression**: Converted files are usually smaller than originals
- **Fallback**: If conversion fails, original file is still uploaded
- **Detailed Logging**: Conversion statistics and status are logged

### Supported File Types

**Convertible to PDF:**

- PowerPoint: `.ppt`, `.pptx`
- Word Documents: `.doc`, `.docx`

**Direct Upload (no conversion):**

- PDF: `.pdf`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Text: `.txt`
- Other formats as configured

### Error Handling

If LibreOffice is not installed or conversion fails:

1. The original file will still be uploaded
2. An error message will be logged
3. The client will receive information about the conversion status
4. Files can still be downloaded normally

### Performance Notes

- Conversion happens in parallel for multiple files
- Large or complex documents may take longer to convert
- PDF files are generally smaller and load faster than PowerPoint files
- Conversion quality depends on LibreOffice version and document complexity

### Troubleshooting

**"LibreOffice executable not found"**

- Install LibreOffice and ensure it's in system PATH
- On Windows, you may need to restart the command prompt/terminal

**"Conversion timeout"**

- The document is too large or complex
- Original file will be uploaded instead
- Consider splitting large presentations

**"Conversion failed"**

- Document may be corrupted or use unsupported features
- Original file will be uploaded as fallback

### Logs

Check server console for conversion details:

```
🔄 Converting presentation.pptx to PDF...
✅ Converted presentation.pptx to PDF successfully
📊 Original size: 2450.5 KB
📊 PDF size: 1830.2 KB
📊 Compression: 25.3%
```
