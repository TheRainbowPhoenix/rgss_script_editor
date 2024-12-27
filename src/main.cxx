#include "ruby_data.hxx"
#include "qt/main_window.hxx"

#include <QtWidgets/QApplication>
#include <QtCore/QTextCodec>
#include <QTranslator>
#include <QLocale>

int main(int argc, char* argv[]) {
  QApplication app(argc, argv);

  QTranslator translator;
  QString locale = QLocale::system().name();
  QString translationPath = QCoreApplication::applicationDirPath() + "/translations";

  // Loading QScintilla translations
  if (translator.load(QString("qscintilla_") + locale, translationPath)) {
      app.installTranslator(&translator);
  }

  QString initial_path;
  if(argc >= 2) {
    initial_path = QString::fromUtf8(argv[1]);
  }

  RGSS_MainWindow main(initial_path);

  QIcon windowIcon(":/res/logo.ico");
  main.setWindowIcon(windowIcon);
  main.show();

  main.activateWindow();
  main.raise();

  return app.exec();
}
