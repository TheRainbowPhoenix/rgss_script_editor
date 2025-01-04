#include "ruby_data.hxx"

#include <QtCore/QFileInfo>
#include <QtWidgets/QApplication>
#include <QtCore/QTextCodec>
#include <QtCore/QTextStream>

#include <iostream>

int saveScripts(QString const& file, const ScriptList &scripts) {
  /* Determine marshal format */
  QFileInfo finfo(file);
  QString fileExt = finfo.suffix();
  Script::Format format;

  if (fileExt == "rxdata")
    format = Script::XP;
  else if (fileExt == "rvdata")
    format = Script::XP;
  else if (fileExt == "rvdata2")
    format = Script::VXAce;
  else {
    std::cerr << "Unrecognized file extension: " << fileExt.toUtf8().constData() << std::endl;
    return 1;
  }

  QFile archiveFile(file);
  if (!archiveFile.open(QFile::WriteOnly)) {
    std::cerr << "Cannot open for writing: " << file.toUtf8().constData() << std::endl;
    return 1;
  }

  try {
    writeScripts(scripts, archiveFile, format);
    archiveFile.close();
  }
  catch (const QByteArray &) {
    std::cerr << "Cannot save: " << file.toUtf8().constData() << std::endl;
    return 1;
  }

  return 0;
}

int import(QString src_folder, ScriptList &scripts) {
	if (src_folder.isEmpty())
		return 1;

	/* Open index */
	QFile indFile(src_folder + "/index.rse");
	if (!indFile.open(QFile::ReadOnly)) {
		std::cerr << "Cannot open index file" << std::endl;
		return 1;
	}

	QTextStream indStream(&indFile);
	indStream.setCodec("UTF-8");

	while (!indStream.atEnd())
	{
		QString line = indStream.readLine();

		/* Minimum is 32bit ID (8 chars) + space */
		if (line.size() < 8 + 1) {
            std::cerr << "Index entry too short: " << line.constData() << std::endl;
			return 1;
		}

		bool parseOK;
		QString scIDStr = line.left(8);
		quint32 scID = scIDStr.toUInt(&parseOK, 16);

		if (!parseOK) {
            std::cerr << "Bad script ID: " << scIDStr.constData() << std::endl;
			return 1;
		}

		QString scName = line.mid(9);
		QString rbName = QString("%1.rb").arg(line.mid(9));
    	QFile scFile(src_folder + "/" + rbName);

		if (!scFile.open(QFile::ReadOnly)) {
			std::cerr << QString("Cannot open script \"%1\" (%2)").arg(rbName, scIDStr).toUtf8().constData() << std::endl;
			return 1;
		}

		QByteArray scData = scFile.readAll();
		scFile.close();

		Script script;
		script.magic = scID;
		script.name = scName;
		script.data = scData;

		scripts.append(script);
	}

	return 0;
}

int main(int argc, char* argv[]) {
	if (argc < 3) {
		puts("Wrong number of arguments (rgss_script_console <input directory> <output filename>)");
		return 1;
	}

	const QString src_folder = QString::fromLocal8Bit(argv[1]);
	const QString out_file = QString::fromLocal8Bit(argv[2]);

	ScriptList scripts;
	if (import(src_folder, scripts))
		return 1;

	if (saveScripts(out_file, scripts))
		return 1;

	std::cout << "Importing Done!" << std::endl;
	return 0;
}
