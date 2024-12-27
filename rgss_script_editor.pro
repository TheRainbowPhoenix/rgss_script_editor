QT       += core gui

greaterThan(QT_MAJOR_VERSION, 4): QT += widgets

CONFIG += c++17

# You can make your code fail to compile if it uses deprecated APIs.
# In order to do so, uncomment the following line.
#DEFINES += QT_DISABLE_DEPRECATED_BEFORE=0x060000    # disables all the APIs deprecated before Qt 6.0.0

msvc{
    QMAKE_CXXFLAGS += -utf-8
}

win32 {
    RC_FILE += app.rc
}

SOURCES += \
    src/main.cxx \
    src/qt/editor_widget.cxx \
    src/qt/goto_line_dialog.cxx \
    src/qt/main_window.cxx \
    src/qt/pinned_script_list.cxx \
    src/qt/savediscard_dialog.cxx \
    src/qt/script_archive.cxx \
    src/qt/search_bar.cxx \
    src/ruby_data.cxx

HEADERS += \
    src/qt/editor_widget.hxx \
    src/qt/goto_line_dialog.hxx \
    src/qt/line_edit.hxx \
    src/qt/main_window.hxx \
    src/qt/pinned_script_list.hxx \
    src/qt/savediscard_dialog.hxx \
    src/qt/script_archive.hxx \
    src/qt/search_bar.hxx \
    src/ruby_data.hxx

INCLUDEPATH += \
    src/ \
    src/qt

LIBS += -lqscintilla2_qt5

# Default rules for deployment.
qnx: target.path = /tmp/$${TARGET}/bin
else: unix:!android: target.path = /opt/$${TARGET}/bin
!isEmpty(target.path): INSTALLS += target

RESOURCES += \
    res.qrc
