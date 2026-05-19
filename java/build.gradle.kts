subprojects {
    repositories {
        mavenCentral()
        // add more if you need them, e.g. mavenLocal(), google(), etc.
    }

    plugins.withType<JavaPlugin> {
        tasks.withType<JavaCompile>().configureEach {
            options.compilerArgs.addAll(listOf(
                "-Xlint:-varargs",
                "-Xlint:-dep-ann"
            ))
            options.isFailOnError = false
        }
    }
}